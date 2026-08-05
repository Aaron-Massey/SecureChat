import { io, Socket } from 'socket.io-client';
import type { SecurePayload } from '@shared/types/payload';
import { PeerConnectionFactory } from '@/factories/peerConnectionFactory';
import type { IceServerConfig } from '@/strategies/iceServerStrategy';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface P2PManagerCallbacks {
  onMessageReceived: (payload: SecurePayload) => void;
  onRekeyRequested: () => void;
  onConnectionStatusChange?: (status: ConnectionStatus, detail?: string) => void;
  onFileHeaderReceived?: (payload: SecurePayload) => void;
  onFileChunkReceived?: (payload: SecurePayload, receivedChunks: number, totalChunks: number) => void;
  onFileTransferComplete?: (fileId: string, headerPayload: SecurePayload, chunkPayloads: SecurePayload[]) => void;
  onFileTransferCancelled?: (fileId: string, reason: string) => void;
}

export class P2PManager {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private callbacks: P2PManagerCallbacks;
  private peerConnectionFactory: PeerConnectionFactory;

  private incomingFileBuffers: Map<string, {
    header: SecurePayload;
    chunks: Map<number, SecurePayload>;
  }> = new Map();
  private rejectedFileIds: Set<string> = new Set();
  private cancelledFileIds: Set<string> = new Set();
  private cancelledPeersPerFile: Map<string, Set<string>> = new Map();
  private iceCandidateQueues: Map<string, RTCIceCandidateInit[]> = new Map();
  private iceRestartAttempts: Map<string, number> = new Map();

  constructor(backendUrl: string, callbacks: P2PManagerCallbacks, iceConfig?: IceServerConfig) {
    this.callbacks = callbacks;
    this.peerConnectionFactory = PeerConnectionFactory.createWithConfig(iceConfig);
    this.socket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling']
    });
    this.registerSocketEvents();
  }

  private registerSocketEvents(): void {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server.');
      this.callbacks.onConnectionStatusChange?.('connected', 'Connected to signaling server.');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`Signaling server disconnected: ${reason}`);
      this.callbacks.onConnectionStatusChange?.('reconnecting', `Signaling server connection lost (${reason}). Retrying...`);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}...`);
      this.callbacks.onConnectionStatusChange?.('reconnecting', `Reconnecting to signaling server (attempt ${attempt})...`);
    });

    this.socket.io.on('reconnect', () => {
      console.log('Successfully reconnected to signaling server.');
      this.callbacks.onConnectionStatusChange?.('connected', 'Reconnected to signaling server.');
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect to signaling server.');
      this.callbacks.onConnectionStatusChange?.('disconnected', 'Connection to signaling server failed.');
    });

    this.socket.on('other-clients', (otherClientIds: string[]) => {
      otherClientIds.forEach(async (peerId) => {
        const peerConnection = this.createPeerConnection(peerId);
        const dataChannel = peerConnection.createDataChannel('secure-chat');
        this.dataChannels.set(peerId, dataChannel);
        this.setupDataChannel(dataChannel, peerId);

        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          this.socket.emit('webrtc-offer', { recipientId: peerId, payload: offer });
        } catch (err) {
          console.error(`Failed to create/send offer to ${peerId}:`, err);
        }
      });
    });

    this.socket.on('new-client', (peerId: string) => {
      console.log(`New client connected: ${peerId}. Initiating connection.`);
      this.createPeerConnection(peerId);
    });

    this.socket.on('webrtc-offer', async ({ senderId, payload }) => {
      let peerConnection = this.peerConnections.get(senderId);
      if (!peerConnection) {
        peerConnection = this.createPeerConnection(senderId);
      }

      const isPolite = Boolean(this.socket.id && this.socket.id < senderId);
      const offerCollision = peerConnection.signalingState !== 'stable';

      if (offerCollision) {
        if (isPolite) {
          try {
            await peerConnection.setLocalDescription({ type: 'rollback' });
          } catch (err) {
            console.warn(`Rollback offer failed for ${senderId}:`, err);
            return;
          }
        } else {
          console.log(`Impolite peer ignoring offer collision from ${senderId}`);
          return;
        }
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
        await this.processQueuedIceCandidates(senderId, peerConnection);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        this.socket.emit('webrtc-answer', { recipientId: senderId, payload: answer });
      } catch (err) {
        console.error(`Failed to process WebRTC offer from ${senderId}:`, err);
      }
    });

    this.socket.on('webrtc-answer', async ({ senderId, payload }) => {
      const peerConnection = this.peerConnections.get(senderId);
      if (!peerConnection) return;

      if (peerConnection.signalingState !== 'have-local-offer') {
        console.warn(`Ignoring WEBRTC answer from ${senderId} because signalingState is '${peerConnection.signalingState}' (expected 'have-local-offer')`);
        return;
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
        await this.processQueuedIceCandidates(senderId, peerConnection);
      } catch (err) {
        console.warn(`Failed to set remote answer for ${senderId}:`, err);
      }
    });

    this.socket.on('new-ice-candidate', async ({ senderId, payload }) => {
      const peerConnection = this.peerConnections.get(senderId);
      if (peerConnection) {
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
          } catch (err) {
            console.warn(`Error adding ICE candidate for ${senderId}:`, err);
          }
        } else {
          const queue = this.iceCandidateQueues.get(senderId) || [];
          queue.push(payload);
          this.iceCandidateQueues.set(senderId, queue);
        }
      }
    });

    this.socket.on('client-disconnected', (peerId: string) => {
      this.disconnectPeer(peerId);
    });

    this.socket.on('rekey', () => {
      console.log('Received rekey event from server.');
      this.callbacks.onRekeyRequested();
    });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = this.peerConnectionFactory.createPeerConnection();

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const cStr = event.candidate.candidate || '';
        const cType = cStr.includes('typ host') ? 'HOST' : cStr.includes('typ srflx') ? 'STUN' : cStr.includes('typ relay') ? 'TURN' : 'UNKNOWN';
        console.log(`ICE candidate generated for peer ${peerId} (${cType})`);
        this.socket.emit('new-ice-candidate', { recipientId: peerId, payload: event.candidate });
      }
    };

    (peerConnection as unknown as { onicecandidateerror: (event: { errorText?: string; errorCode?: number; url?: string }) => void }).onicecandidateerror = (event) => {
      if (event.url && event.url.includes('turn:')) {
        console.warn(`TURN server candidate lookup error for peer ${peerId} (${event.url}): ${event.errorText || event.errorCode}`);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log(`Peer ${peerId} ICE connection state: ${state}`);
      if (state === 'connected' || state === 'completed') {
        this.iceRestartAttempts.delete(peerId);
      } else if (state === 'disconnected' || state === 'failed') {
        const attempts = this.iceRestartAttempts.get(peerId) || 0;
        if (attempts < 5) {
          console.warn(`ICE connection state '${state}' for peer ${peerId}. Initiating auto-reconnect / ICE restart (attempt ${attempts + 1}/5)...`);
          this.attemptPeerIceRestart(peerId, peerConnection);
        } else {
          console.warn(`ICE connection state '${state}' for peer ${peerId}. Max ICE restart attempts reached (5/5).`);
        }
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.dataChannels.set(peerId, dataChannel);
      this.setupDataChannel(dataChannel, peerId);
    };

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  private async processQueuedIceCandidates(peerId: string, peerConnection: RTCPeerConnection): Promise<void> {
    const queue = this.iceCandidateQueues.get(peerId);
    if (!queue || queue.length === 0) return;
    this.iceCandidateQueues.delete(peerId);

    for (const candidate of queue) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`Error processing queued ICE candidate for ${peerId}:`, err);
      }
    }
  }

  private async attemptPeerIceRestart(peerId: string, peerConnection: RTCPeerConnection): Promise<void> {
    const attempts = this.iceRestartAttempts.get(peerId) || 0;
    this.iceRestartAttempts.set(peerId, attempts + 1);

    const isInitiator = Boolean(!this.socket.id || this.socket.id > peerId);
    if (!isInitiator) {
      console.log(`Peer ${peerId} ICE restart needed. Waiting for peer ${peerId} to initiate restart offer...`);
      return;
    }

    try {
      if (peerConnection.signalingState === 'stable') {
        const offer = await peerConnection.createOffer({ iceRestart: true });
        await peerConnection.setLocalDescription(offer);
        this.socket.emit('webrtc-offer', { recipientId: peerId, payload: offer });
        console.log(`Sent ICE restart offer to ${peerId} (attempt ${attempts + 1}/5)`);
      }
    } catch (err) {
      console.error(`Failed to perform ICE restart for ${peerId}:`, err);
    }
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      console.log(`P2P DataChannel with ${peerId} established!`);
      this.callbacks.onConnectionStatusChange?.('connected', `Established P2P connection with peer ${peerId}.`);
    };
    channel.onclose = () => {
      console.log(`P2P DataChannel with ${peerId} closed.`);
    };
    channel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as SecurePayload;
        if (payload.type === 'file-header') {
          this.handleIncomingFileHeader(payload);
        } else if (payload.type === 'file-chunk') {
          this.handleIncomingFileChunk(payload);
        } else if (payload.type === 'file-cancel') {
          this.handleIncomingFileCancel(payload);
        } else {
          this.callbacks.onMessageReceived(payload);
        }
      } catch (err) {
        console.error(`Failed to parse incoming P2P message from ${peerId}:`, err);
      }
    };
  }

  private handleIncomingFileHeader(payload: SecurePayload): void {
    if (!payload.fileMetadata) return;
    const fileId = payload.fileMetadata.fileId;
    this.incomingFileBuffers.set(fileId, {
      header: payload,
      chunks: new Map<number, SecurePayload>()
    });

    this.callbacks.onFileHeaderReceived?.(payload);
    this.callbacks.onMessageReceived(payload);
  }

  private handleIncomingFileChunk(payload: SecurePayload): void {
    if (!payload.chunkMetadata) return;
    const { fileId, chunkIndex, totalChunks } = payload.chunkMetadata;

    if (this.rejectedFileIds.has(fileId)) {
      // Fail-Fast: Drop chunk immediately without allocating memory or processing
      return;
    }

    const fileEntry = this.incomingFileBuffers.get(fileId);

    if (fileEntry) {
      fileEntry.chunks.set(chunkIndex, payload);
      const receivedCount = fileEntry.chunks.size;

      this.callbacks.onFileChunkReceived?.(payload, receivedCount, totalChunks);

      if (receivedCount === totalChunks) {
        const assembled: SecurePayload[] = [];
        for (let i = 0; i < totalChunks; i++) {
          const chunkPayload = fileEntry.chunks.get(i);
          if (chunkPayload) assembled.push(chunkPayload);
        }

        this.callbacks.onFileTransferComplete?.(fileId, fileEntry.header, assembled);
        this.incomingFileBuffers.delete(fileId);
      }
    }
  }

  private handleIncomingFileCancel(payload: SecurePayload): void {
    const fileId = payload.fileMetadata?.fileId;
    const peerId = payload.senderSessionId;
    if (fileId) {
      this.cancelledFileIds.add(fileId);
      if (peerId) {
        if (!this.cancelledPeersPerFile.has(fileId)) {
          this.cancelledPeersPerFile.set(fileId, new Set());
        }
        this.cancelledPeersPerFile.get(fileId)!.add(peerId);
      }
      this.incomingFileBuffers.delete(fileId);
      this.callbacks.onFileTransferCancelled?.(fileId, payload.plaintext || 'File transfer cancelled');
    }
    this.callbacks.onMessageReceived(payload);
  }

  public rejectFileTransfer(fileId: string): void {
    this.rejectedFileIds.add(fileId);
    this.incomingFileBuffers.delete(fileId);
  }

  public isRejectedFile(fileId: string): boolean {
    return this.rejectedFileIds.has(fileId);
  }

  public isCancelledFile(fileId: string): boolean {
    return this.cancelledFileIds.has(fileId);
  }

  public isCancelledByPeer(fileId: string, peerId: string): boolean {
    return Boolean(this.cancelledPeersPerFile.get(fileId)?.has(peerId));
  }

  public get socketId(): string {
    return this.socket?.id || 'local-session';
  }

  public getSessionId(): string {
    return this.socketId;
  }

  public broadcastMessage(payload: SecurePayload): void {
    if (!payload.senderSessionId) {
      payload.senderSessionId = this.socketId;
    }
    const messageString = JSON.stringify(payload);
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(messageString);
      } else {
        console.warn(`Data channel to ${peerId} is not open (state: ${channel.readyState}). Cannot send message.`);
      }
    });
  }

  public async broadcastChunkWithBackpressure(payload: SecurePayload): Promise<void> {
    if (!payload.senderSessionId) {
      payload.senderSessionId = this.socketId;
    }
    const messageString = JSON.stringify(payload);
    const fileId = payload.chunkMetadata?.fileId;

    const sendPromises = Array.from(this.dataChannels.entries()).map(([peerId, channel]) => {
      return new Promise<void>((resolve) => {
        if (channel.readyState !== 'open') {
          resolve();
          return;
        }

        // Per-Peer Filter: Skip sending chunk if this specific peer cancelled this fileId
        if (fileId && this.cancelledPeersPerFile.get(fileId)?.has(peerId)) {
          resolve();
          return;
        }

        channel.bufferedAmountLowThreshold = 65536; // 64 KB High-Water Mark

        const trySend = () => {
          if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
            channel.onbufferedamountlow = () => {
              channel.onbufferedamountlow = null;
              trySend();
            };
          } else {
            channel.send(messageString);
            resolve();
          }
        };

        trySend();
      });
    });

    await Promise.all(sendPromises);
  }

  public async sendFilePayloads(
    headerPayload: SecurePayload,
    chunkPayloads: SecurePayload[]
  ): Promise<void> {
    const fileId = headerPayload.fileMetadata?.fileId;
    this.broadcastMessage(headerPayload);

    for (const chunkPayload of chunkPayloads) {
      if (fileId) {
        const cancelledPeers = this.cancelledPeersPerFile.get(fileId);
        // Abort global loop ONLY if ALL active data channels have cancelled this file
        if (cancelledPeers && cancelledPeers.size > 0 && cancelledPeers.size >= this.dataChannels.size) {
          console.warn(`All connected peers cancelled file ${fileId}. Aborting chunk transmission.`);
          break;
        }
      }
      await this.broadcastChunkWithBackpressure(chunkPayload);
    }
  }

  public disconnectPeer(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    this.dataChannels.delete(peerId);
    this.iceCandidateQueues.delete(peerId);
    this.iceRestartAttempts.delete(peerId);
    console.log(`Client ${peerId} disconnected.`);
  }

  public destroy(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.incomingFileBuffers.clear();
    this.iceCandidateQueues.clear();
    this.iceRestartAttempts.clear();
    this.socket.disconnect();
  }
}


