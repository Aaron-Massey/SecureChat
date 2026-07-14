import { ref, reactive } from 'vue';
import { io } from 'socket.io-client';
import type { SecurePayload } from '../../../shared/types/payload';
import { useCryptoStore } from '@/stores/crypto';

export function useP2P() {
  const cryptoStore = useCryptoStore();
  const backendUrl = `http://${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT}`;
  const socket = io(backendUrl);

  const peerConnections = reactive<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = reactive<Map<string, RTCDataChannel>>(new Map());

  const chatHistory = ref<{ sender: string; text: string; decrypted: boolean }[]>([]);
  const debugHistory = ref<SecurePayload[]>([]);

  const createPeerConnection = (peerId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('new-ice-candidate', { recipientId: peerId, payload: event.candidate });
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannels.set(peerId, dataChannel);
      setupDataChannel(dataChannel, peerId);
    };

    peerConnections.set(peerId, peerConnection);
    return peerConnection;
  };

  const setupDataChannel = (channel: RTCDataChannel, peerId: string) => {
    channel.onopen = () => console.log(`P2P Connection with ${peerId} established!`);
    channel.onclose = () => console.log(`P2P Connection with ${peerId} closed.`);
    channel.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      debugHistory.value.push(payload);

      const result = cryptoStore.decryptMessage(payload);
      if (result.success) {
        chatHistory.value.push({ sender: result.senderDisplayName, text: result.plaintext, decrypted: true });
      } else {
        chatHistory.value.push({ sender: payload.senderDisplayName, text: 'Failed to decrypt message', decrypted: false });
      }
    };
  };

  socket.on('other-clients', (otherClientIds: string[]) => {
    otherClientIds.forEach(async (peerId) => {
      const peerConnection = createPeerConnection(peerId);
      const dataChannel = peerConnection.createDataChannel('secure-chat');
      dataChannels.set(peerId, dataChannel);
      setupDataChannel(dataChannel, peerId);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('webrtc-offer', { recipientId: peerId, payload: offer });
    });
  });

  socket.on('new-client', (peerId: string) => {
    console.log(`New client connected: ${peerId}. Initiating connection.`);
    createPeerConnection(peerId);
  });

  socket.on('webrtc-offer', async ({ senderId, payload }) => {
    const peerConnection = peerConnections.get(senderId) ?? createPeerConnection(senderId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('webrtc-answer', { recipientId: senderId, payload: answer });
  });

  socket.on('webrtc-answer', async ({ senderId, payload }) => {
    const peerConnection = peerConnections.get(senderId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
    }
  });

  socket.on('new-ice-candidate', async ({ senderId, payload }) => {
    const peerConnection = peerConnections.get(senderId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
    }
  });

  socket.on('client-disconnected', (peerId: string) => {
    const peerConnection = peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.delete(peerId);
    }
    if (dataChannels.has(peerId)) {
      dataChannels.delete(peerId);
    }
    console.log(`Client ${peerId} disconnected.`);
  });


  socket.on('rekey', () => {
    console.log('Received rekey event from server.');
    cryptoStore.rekey();
    chatHistory.value.push({ sender: 'System', text: 'Encryption keys have been rotated.', decrypted: true });
  });

  const sendP2PMessage = (plaintext: string, senderDisplayName: string) => {
    try {
      const encryptedPayload = cryptoStore.encryptMessage(plaintext, senderDisplayName);
      const messageString = JSON.stringify(encryptedPayload);

      dataChannels.forEach((channel, peerId) => {
        if (channel.readyState === 'open') {
          channel.send(messageString);
        } else {
          console.warn(`Data channel to ${peerId} is not open. Cannot send message.`);
        }
      });

      chatHistory.value.push({ sender: 'Me', text: plaintext, decrypted: true });
      debugHistory.value.push(encryptedPayload);
    } catch (error) {
      console.error("Failed to send encrypted message:", error);
    }
  };

  return { sendP2PMessage, chatHistory, debugHistory };
}
