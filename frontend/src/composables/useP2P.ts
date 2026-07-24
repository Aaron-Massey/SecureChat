import { ref, onUnmounted } from 'vue';
import type { SecurePayload, FileMetadata } from '@shared/types/payload';
import { useCryptoStore } from '@/stores/crypto';
import { P2PManager, type ConnectionStatus } from '@/services/p2pManager';
import { PayloadFactory } from '@/factories/payload.factory';
import { ConnectionStateContext } from '@/patterns/connectionState';
import { CommandQueueManager, SendTextMessageCommand, SendFileMessageCommand } from '@/commands/chatCommands';
import {
  sliceFileIntoChunks,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  computeBufferHash,
  createObjectUrlFromBuffers,
  DEFAULT_CHUNK_SIZE
} from '@/utils/fileChunker';

export interface ChatMessage {
  id?: string;
  sender: string;
  text?: string;
  decrypted: boolean;
  timestamp: string;
  fileAttachment?: {
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    mediaUrl?: string;
    progress?: number;
    isTransferring?: boolean;
  };
}

export function useP2P() {
  const cryptoStore = useCryptoStore();
  const chatHistory = ref<ChatMessage[]>([]);
  const debugHistory = ref<SecurePayload[]>([]);
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const connectionDetail = ref<string>('Initializing...');

  const stateContext = new ConnectionStateContext();
  const commandQueue = new CommandQueueManager();

  const backendUrl = window.location.origin;

  const handleIncomingMessage = (payload: SecurePayload) => {
    debugHistory.value.push(payload);
    const timestamp = payload.timestamp;

    if (payload.type === 'file-header') {
      return; // Handled separately in handleFileHeader
    }

    if (payload.cipher === 'none' && payload.plaintext) {
      chatHistory.value.push({
        sender: payload.senderDisplayName,
        text: payload.plaintext,
        decrypted: true,
        timestamp
      });
    } else if (payload.ciphertext) {
      const result = cryptoStore.decryptMessage(payload);
      if (result.success) {
        chatHistory.value.push({
          sender: result.senderDisplayName,
          text: result.plaintext,
          decrypted: true,
          timestamp
        });
      } else {
        chatHistory.value.push({
          sender: payload.senderDisplayName,
          text: 'Failed to decrypt message',
          decrypted: false,
          timestamp
        });
      }
    }
  };

  const handleFileHeaderReceived = (headerPayload: SecurePayload) => {
    if (!headerPayload.fileMetadata) return;
    const meta = headerPayload.fileMetadata;
    const timestamp = headerPayload.timestamp;

    let isHeaderDecrypted = true;
    if (headerPayload.cipher !== 'none') {
      if (!cryptoStore.isReady) {
        isHeaderDecrypted = false;
      } else {
        const headerDecryptRes = cryptoStore.decryptMessage(headerPayload);
        if (!headerDecryptRes.success) {
          isHeaderDecrypted = false;
        }
      }
    }

    chatHistory.value.push({
      id: meta.fileId,
      sender: headerPayload.senderDisplayName,
      decrypted: isHeaderDecrypted,
      text: isHeaderDecrypted ? undefined : `⚠️ Key verification failed for file "${meta.fileName}"`,
      timestamp,
      fileAttachment: {
        fileId: meta.fileId,
        fileName: meta.fileName,
        fileSize: meta.fileSize,
        mimeType: meta.mimeType,
        progress: 0,
        isTransferring: true
      }
    });
  };

  const handleFileChunkReceived = (
    _chunkPayload: SecurePayload,
    receivedChunks: number,
    totalChunks: number
  ) => {
    if (!_chunkPayload.chunkMetadata) return;
    const { fileId } = _chunkPayload.chunkMetadata;
    const msg = chatHistory.value.find((m) => m.fileAttachment?.fileId === fileId);
    if (msg && msg.fileAttachment) {
      msg.fileAttachment.progress = Math.round((receivedChunks / totalChunks) * 100);
    }
  };

  const handleFileTransferComplete = (
    fileId: string,
    headerPayload: SecurePayload,
    chunkPayloads: SecurePayload[]
  ) => {
    if (!headerPayload.fileMetadata) return;
    const meta = headerPayload.fileMetadata;

    let keyVerificationPassed = true;

    // Decrypt assembled chunk payloads if encrypted, or extract plaintext chunks
    const decryptedBuffers: ArrayBuffer[] = chunkPayloads.map((chunkPayload) => {
      if (chunkPayload.cipher !== 'none') {
        if (!cryptoStore.isReady || !chunkPayload.ciphertext) {
          keyVerificationPassed = false;
          return new ArrayBuffer(0);
        }
        const decryptRes = cryptoStore.decryptMessage(chunkPayload);
        if (decryptRes.success) {
          return base64ToArrayBuffer(decryptRes.plaintext);
        }
        keyVerificationPassed = false;
        console.warn(`Failed to decrypt file chunk for ${meta.fileName}:`, decryptRes.error);
        return new ArrayBuffer(0);
      }

      const rawData = chunkPayload.plaintext || chunkPayload.ciphertext || '';
      return base64ToArrayBuffer(rawData);
    });

    // Verify first chunk hash against metadata fileHash if present
    if (keyVerificationPassed && meta.fileHash && decryptedBuffers.length > 0) {
      const computedHash = computeBufferHash(decryptedBuffers[0] || new ArrayBuffer(0));
      if (computedHash !== meta.fileHash) {
        console.warn(`File hash verification mismatch for ${meta.fileName}`);
        keyVerificationPassed = false;
      }
    }

    const msg = chatHistory.value.find((m) => m.fileAttachment?.fileId === fileId);
    if (msg && msg.fileAttachment) {
      msg.fileAttachment.isTransferring = false;
      msg.fileAttachment.progress = 100;
      if (keyVerificationPassed) {
        msg.decrypted = true;
        msg.fileAttachment.mediaUrl = createObjectUrlFromBuffers(decryptedBuffers, meta.mimeType);
      } else {
        msg.decrypted = false;
        msg.text = `⚠️ Key verification / decryption failed for file "${meta.fileName}"`;
        msg.fileAttachment.mediaUrl = '';
      }
    }
  };

  const handleRekeyRequested = () => {
    cryptoStore.rekey();
    chatHistory.value.push({
      sender: 'System',
      text: 'Encryption keys have been rotated.',
      decrypted: true,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleConnectionStatusChange = (status: ConnectionStatus, detail?: string) => {
    const prevStatus = connectionStatus.value;
    const currentStateObj = stateContext.setState(status);

    connectionStatus.value = status;
    connectionDetail.value = currentStateObj.getStatusDetail(detail);

    if (prevStatus !== status && detail) {
      chatHistory.value.push({
        sender: 'System',
        text: connectionDetail.value,
        decrypted: true,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    if (status === 'connected' && commandQueue.pendingCount > 0) {
      commandQueue.flush();
    }
  };

  const iceConfig = {
    turnUrl: import.meta.env.VITE_TURN_SERVER_URL,
    turnUsername: import.meta.env.VITE_TURN_USERNAME,
    turnPassword: import.meta.env.VITE_TURN_PASSWORD
  };

  const p2pManager = new P2PManager(backendUrl, {
    onMessageReceived: handleIncomingMessage,
    onRekeyRequested: handleRekeyRequested,
    onConnectionStatusChange: handleConnectionStatusChange,
    onFileHeaderReceived: handleFileHeaderReceived,
    onFileChunkReceived: handleFileChunkReceived,
    onFileTransferComplete: handleFileTransferComplete
  }, iceConfig);

  const sendP2PMessage = (plaintext: string, senderDisplayName: string) => {
    const currentState = stateContext.state;
    if (!currentState.canSend && connectionStatus.value !== 'connected') {
      const cmd = new SendTextMessageCommand((t, s) => p2pManager.broadcastMessage(s === senderDisplayName ? PayloadFactory.createTextPayload(s, t) : cryptoStore.encryptMessage(t, s)), plaintext, senderDisplayName);
      commandQueue.enqueue(cmd);
    }

    sendP2PMessageDirect(plaintext, senderDisplayName);
  };

  const sendP2PMessageDirect = (plaintext: string, senderDisplayName: string) => {
    let payload: SecurePayload;
    const timestamp = new Date().toLocaleTimeString();

    if (cryptoStore.isReady) {
      payload = cryptoStore.encryptMessage(plaintext, senderDisplayName);
      payload.timestamp = timestamp;
      payload.type = 'text';
    } else {
      payload = PayloadFactory.createTextPayload(senderDisplayName, plaintext, timestamp);
    }

    p2pManager.broadcastMessage(payload);

    chatHistory.value.push({
      sender: 'Me',
      text: plaintext,
      decrypted: true,
      timestamp
    });

    debugHistory.value.push(payload);
  };

  const sendP2PFile = async (file: File, senderDisplayName: string): Promise<void> => {
    const currentState = stateContext.state;
    if (!currentState.canSend && connectionStatus.value !== 'connected') {
      const cmd = new SendFileMessageCommand((f, s) => sendP2PFileDirect(f, s), file, senderDisplayName);
      commandQueue.enqueue(cmd);
      return;
    }

    await sendP2PFileDirect(file, senderDisplayName);
  };

  const sendP2PFileDirect = async (file: File, senderDisplayName: string): Promise<void> => {
    const timestamp = new Date().toLocaleTimeString();
    const rawChunks = await sliceFileIntoChunks(file);
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fileHash = computeBufferHash(rawChunks[0] || new ArrayBuffer(0));

    const fileMetadata: FileMetadata = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks: rawChunks.length,
      chunkSize: DEFAULT_CHUNK_SIZE,
      fileHash
    };

    let headerPayload: SecurePayload;

    if (cryptoStore.isReady) {
      const encrypted = cryptoStore.encryptMessage(`FILE:${file.name}`, senderDisplayName);
      headerPayload = PayloadFactory.createFileHeaderPayload(senderDisplayName, fileMetadata, encrypted, timestamp);
    } else {
      headerPayload = PayloadFactory.createFileHeaderPayload(senderDisplayName, fileMetadata, undefined, timestamp);
    }

    const chunkPayloads: SecurePayload[] = [];
    const localBuffers: ArrayBuffer[] = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      if (!chunk) continue;
      const base64Chunk = arrayBufferToBase64(chunk);
      localBuffers.push(chunk);

      let chunkPayload: SecurePayload;
      const chunkMetadata = {
        fileId,
        chunkIndex: i,
        totalChunks: rawChunks.length
      };

      if (cryptoStore.isReady) {
        const encryptedChunk = cryptoStore.encryptMessage(base64Chunk, senderDisplayName);
        chunkPayload = PayloadFactory.createFileChunkPayload(senderDisplayName, chunkMetadata, encryptedChunk, undefined, timestamp);
      } else {
        chunkPayload = PayloadFactory.createFileChunkPayload(senderDisplayName, chunkMetadata, undefined, base64Chunk, timestamp);
      }

      chunkPayloads.push(chunkPayload);
    }

    await p2pManager.sendFilePayloads(headerPayload, chunkPayloads);

    const mediaUrl = createObjectUrlFromBuffers(localBuffers, fileMetadata.mimeType);

    chatHistory.value.push({
      id: fileId,
      sender: 'Me',
      decrypted: true,
      timestamp,
      fileAttachment: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: fileMetadata.mimeType,
        mediaUrl,
        progress: 100,
        isTransferring: false
      }
    });

    debugHistory.value.push(headerPayload);
  };

  onUnmounted(() => {
    p2pManager.destroy();
  });

  return { sendP2PMessage, sendP2PFile, chatHistory, debugHistory, connectionStatus, connectionDetail };
}

