import { ref, onUnmounted } from 'vue';
import type { SecurePayload, FileMetadata } from '@shared/types/payload';
import { useCryptoStore } from '@/stores/crypto';
import { P2PManager, type ConnectionStatus } from '@/services/p2pManager';
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

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const backendUrl = import.meta.env.DEV
    ? `${protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`
    : window.location.origin;

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
    connectionStatus.value = status;
    connectionDetail.value = detail || '';

    if (prevStatus !== status && detail) {
      chatHistory.value.push({
        sender: 'System',
        text: detail,
        decrypted: true,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const p2pManager = new P2PManager(backendUrl, {
    onMessageReceived: handleIncomingMessage,
    onRekeyRequested: handleRekeyRequested,
    onConnectionStatusChange: handleConnectionStatusChange,
    onFileHeaderReceived: handleFileHeaderReceived,
    onFileChunkReceived: handleFileChunkReceived,
    onFileTransferComplete: handleFileTransferComplete
  });

  const sendP2PMessage = (plaintext: string, senderDisplayName: string) => {
    let payload: SecurePayload;
    const timestamp = new Date().toLocaleTimeString();

    if (cryptoStore.isReady) {
      payload = cryptoStore.encryptMessage(plaintext, senderDisplayName);
      payload.timestamp = timestamp;
      payload.type = 'text';
    } else {
      payload = {
        senderDisplayName,
        plaintext,
        cipher: 'none',
        type: 'text',
        timestamp
      };
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

    let cipherType: 'AES' | 'DES' | 'none' = 'none';
    let headerPayload: SecurePayload;

    if (cryptoStore.isReady) {
      headerPayload = cryptoStore.encryptMessage(`FILE:${file.name}`, senderDisplayName);
      cipherType = headerPayload.cipher;
    } else {
      headerPayload = {
        senderDisplayName,
        plaintext: `FILE:${file.name}`,
        cipher: 'none',
        timestamp
      };
    }

    headerPayload.type = 'file-header';
    headerPayload.fileMetadata = fileMetadata;
    headerPayload.timestamp = timestamp;

    const chunkPayloads: SecurePayload[] = [];
    const localBuffers: ArrayBuffer[] = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      if (!chunk) continue;
      const base64Chunk = arrayBufferToBase64(chunk);
      localBuffers.push(chunk);

      let chunkPayload: SecurePayload;

      if (cryptoStore.isReady) {
        chunkPayload = cryptoStore.encryptMessage(base64Chunk, senderDisplayName);
      } else {
        chunkPayload = {
          senderDisplayName,
          plaintext: base64Chunk,
          cipher: 'none',
          timestamp
        };
      }

      chunkPayload.type = 'file-chunk';
      chunkPayload.timestamp = timestamp;
      chunkPayload.chunkMetadata = {
        fileId,
        chunkIndex: i,
        totalChunks: rawChunks.length
      };

      chunkPayloads.push(chunkPayload);
    }

    // Broadcast file header and chunks over WebRTC
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

