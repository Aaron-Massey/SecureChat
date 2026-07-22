import { ref, onUnmounted } from 'vue';
import type { SecurePayload } from '@shared/types/payload';
import { useCryptoStore } from '@/stores/crypto';
import { P2PManager, type ConnectionStatus } from '@/services/p2pManager';

export interface ChatMessage {
  sender: string;
  text: string;
  decrypted: boolean;
  timestamp: string;
}

export function useP2P() {
  const cryptoStore = useCryptoStore();
  const chatHistory = ref<ChatMessage[]>([]);
  const debugHistory = ref<SecurePayload[]>([]);
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const connectionDetail = ref<string>('Initializing...');

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const backendUrl = `${protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`;

  const handleIncomingMessage = (payload: SecurePayload) => {
    debugHistory.value.push(payload);
    const timestamp = payload.timestamp;

    if (payload.cipher === 'none' && payload.plaintext) {
      chatHistory.value.push({
        sender: payload.senderDisplayName,
        text: payload.plaintext,
        decrypted: true,
        timestamp
      });
    } else {
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
    onConnectionStatusChange: handleConnectionStatusChange
  });

  const sendP2PMessage = (plaintext: string, senderDisplayName: string) => {
    let payload: SecurePayload;
    const timestamp = new Date().toLocaleTimeString();

    if (cryptoStore.isReady) {
      payload = cryptoStore.encryptMessage(plaintext, senderDisplayName);
      payload.timestamp = timestamp;
    } else {
      payload = {
        senderDisplayName,
        plaintext,
        cipher: 'none',
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

  onUnmounted(() => {
    p2pManager.destroy();
  });

  return { sendP2PMessage, chatHistory, debugHistory, connectionStatus, connectionDetail };
}
