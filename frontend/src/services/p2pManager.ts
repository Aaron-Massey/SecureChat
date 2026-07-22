import { io, Socket } from 'socket.io-client';
import type { SecurePayload } from '@shared/types/payload';

export interface P2PManagerCallbacks {
  onMessageReceived: (payload: SecurePayload) => void;
  onRekeyRequested: () => void;
}

export class P2PManager {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private callbacks: P2PManagerCallbacks;

  constructor(backendUrl: string, callbacks: P2PManagerCallbacks) {
    this.callbacks = callbacks;
    this.socket = io(backendUrl);
    this.registerSocketEvents();
  }

  private registerSocketEvents(): void {
    this.socket.on('other-clients', (otherClientIds: string[]) => {
      otherClientIds.forEach(async (peerId) => {
        const peerConnection = this.createPeerConnection(peerId);
        const dataChannel = peerConnection.createDataChannel('secure-chat');
        this.dataChannels.set(peerId, dataChannel);
        this.setupDataChannel(dataChannel, peerId);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.socket.emit('webrtc-offer', { recipientId: peerId, payload: offer });
      });
    });

    this.socket.on('new-client', (peerId: string) => {
      console.log(`New client connected: ${peerId}. Initiating connection.`);
      this.createPeerConnection(peerId);
    });

    this.socket.on('webrtc-offer', async ({ senderId, payload }) => {
      const peerConnection = this.peerConnections.get(senderId) ?? this.createPeerConnection(senderId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      this.socket.emit('webrtc-answer', { recipientId: senderId, payload: answer });
    });

    this.socket.on('webrtc-answer', async ({ senderId, payload }) => {
      const peerConnection = this.peerConnections.get(senderId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
      }
    });

    this.socket.on('new-ice-candidate', async ({ senderId, payload }) => {
      const peerConnection = this.peerConnections.get(senderId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
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
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('new-ice-candidate', { recipientId: peerId, payload: event.candidate });
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

  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => console.log(`P2P Connection with ${peerId} established!`);
    channel.onclose = () => console.log(`P2P Connection with ${peerId} closed.`);
    channel.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as SecurePayload;
        this.callbacks.onMessageReceived(payload);
      } catch (err) {
        console.error(`Failed to parse incoming P2P message from ${peerId}:`, err);
      }
    };
  }

  public broadcastMessage(payload: SecurePayload): void {
    const messageString = JSON.stringify(payload);
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(messageString);
      } else {
        console.warn(`Data channel to ${peerId} is not open. Cannot send message.`);
      }
    });
  }

  public disconnectPeer(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    this.dataChannels.delete(peerId);
    console.log(`Client ${peerId} disconnected.`);
  }

  public destroy(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.socket.disconnect();
  }
}
