<template>
  <div class="grid-container">
    <div class="chat-pane">
      <h2>SecureChat P2P</h2>

      <SetupBar
        v-model:displayName="displayName"
        v-model:passwordInput="passwordInput"
        v-model:activeBitLength="crypto.activeBitLength"
        @setupFinalized="finalizeKeySetup"
        @inputStarted="setupStarted = true"
      />

      <div v-if="setupStarted || crypto.isReady" class="chat-content">
        <ModeBanner :isEncrypted="crypto.isEncrypted" :connectionStatus="connectionStatus" />

        <MessageFeed
          :chatHistory="chatHistory"
          v-model:showUndecrypted="showUndecrypted"
        />

        <MessageInput @send="sendMessage" @sendFile="handleSendFile" />
      </div>
      <div v-else class="crypto-prompt">
        <p>Please set a display name. Leave the passphrase blank to send unencrypted messages.</p>
      </div>
    </div>

    <CipherTerminal :debugHistory="debugHistory" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCryptoStore } from '@/stores/crypto';
import { useP2P } from '@/composables/useP2P';
import SetupBar from '@/components/chat/SetupBar.vue';
import ModeBanner from '@/components/chat/ModeBanner.vue';
import MessageFeed from '@/components/chat/MessageFeed.vue';
import MessageInput from '@/components/chat/MessageInput.vue';
import CipherTerminal from '@/components/chat/CipherTerminal.vue';

const crypto = useCryptoStore();
const { sendP2PMessage, sendP2PFile, chatHistory, debugHistory, connectionStatus } = useP2P();

const passwordInput = ref('');
const displayName = ref('');
const showUndecrypted = ref(true);
const setupStarted = ref(false);

const sendMessage = (text: string) => {
  if (!text || (!setupStarted.value && !crypto.isReady)) return;
  const nameToUse = displayName.value.trim() || 'Anonymous';
  sendP2PMessage(text, nameToUse);
};

const handleSendFile = (file: File) => {
  if (!file || (!setupStarted.value && !crypto.isReady)) return;
  const nameToUse = displayName.value.trim() || 'Anonymous';
  sendP2PFile(file, nameToUse);
};


const finalizeKeySetup = () => {
  try {
    crypto.setupKeys(passwordInput.value);
  } catch (error) {
    console.error('Key setup failed:', error);
  }
};
</script>

<style scoped>
.grid-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: monospace;
}
.chat-pane {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #444;
}
.chat-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}
.crypto-prompt {
  text-align: center;
  margin-top: 3rem;
  color: #888;
}

@media (max-width: 48rem) {
  .grid-container {
    flex-direction: column;
  }
  .chat-pane {
    border-right: none;
    border-bottom: 1px solid #444;
    padding-top: 3.75rem;
  }
}
</style>
