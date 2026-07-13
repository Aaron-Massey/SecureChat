<template>
  <div class="grid-container">
    <!-- LEFT PANE: Plaintext Chat & Controls -->
    <div class="chat-pane">
      <h2>SecureChat P2P</h2>

      <!-- Crypto Setup Area -->
      <div class="setup-bar">
        <input v-model="displayName" placeholder="Display Name" />
        <input v-model="passwordInput" placeholder="Shared Passphrase" />
        <select v-model="crypto.activeBitLength">
          <option :value="128">AES (128-bit)</option>
          <option :value="56">DES (56-bit)</option>
        </select>
        <button @click="crypto.setupKeys(passwordInput)">
          {{ crypto.isReady ? 'Update Keys' : 'Set Keys' }}
        </button>
      </div>

      <!-- Connection & Chat Feed -->
      <div v-if="crypto.isReady" class="chat-content">
        <div class="controls-bar">
          <label>
            <input type="checkbox" v-model="showUndecrypted" />
            Show undecryptable messages
          </label>
        </div>

        <div class="message-feed" ref="chatFeed">
          <div v-for="(msg, index) in filteredChatHistory" :key="index" :class="{ 'undecrypted': !msg.decrypted }">
            <strong>{{ msg.sender }}:</strong> <span>{{ msg.text }}</span>
          </div>
        </div>

        <div class="input-area">
          <input
            ref="messageInputRef"
            v-model="messageInput"
            @keyup.enter="sendMessage"
            placeholder="Type a message..."
          />
          <button @click="sendMessage">Send</button>
        </div>
      </div>
      <div v-else class="crypto-prompt">
        <p>Please set a display name and a shared passphrase to begin.</p>
      </div>
    </div>

    <!-- RIGHT PANE: Ciphertext Debug Terminal -->
    <div class="debug-pane">
      <h3>Ciphertext Terminal</h3>
      <div class="terminal-feed" ref="debugFeed">
        <pre v-for="(payload, index) in debugHistory" :key="index">
          [Sender: {{ payload.senderDisplayName }} | Cipher: {{ payload.cipher }} | Version: {{ payload.version }}]
          IV: {{ payload.iv }}
          HMAC: {{ payload.hmac }}
          Ciphertext: {{ payload.ciphertext }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useCryptoStore } from '@/stores/crypto'
import { useP2P } from '@/composables/useP2P'

const crypto = useCryptoStore()
const { sendP2PMessage, chatHistory, debugHistory } = useP2P()

const passwordInput = ref('')
const messageInput = ref('')
const displayName = ref('Anonymous')
const showUndecrypted = ref(false)

const chatFeed = ref<HTMLElement | null>(null)
const debugFeed = ref<HTMLElement | null>(null)
const messageInputRef = ref<HTMLInputElement | null>(null)

const filteredChatHistory = computed(() => {
  if (showUndecrypted.value) {
    return chatHistory.value;
  }
  return chatHistory.value.filter(msg => msg.decrypted);
});

const sendMessage = () => {
  if (!messageInput.value || !crypto.isReady) return
  sendP2PMessage(messageInput.value, displayName.value)
  messageInput.value = ''
}

const handleGlobalKeyPress = (event: KeyboardEvent) => {
  // Don't interfere if the user is already typing in an input, textarea, or select
  const target = event.target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    return;
  }

  // Focus the message input if a printable character is pressed
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    messageInputRef.value?.focus();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyPress);
});


watch(filteredChatHistory, async () => {
  await nextTick()
  if (chatFeed.value) {
    chatFeed.value.scrollTop = chatFeed.value.scrollHeight
  }
}, { deep: true })

watch(debugHistory, async () => {
  await nextTick()
  if (debugFeed.value) {
    debugFeed.value.scrollTop = debugFeed.value.scrollHeight
  }
}, { deep: true })
</script>

<style scoped>
.grid-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: monospace;
}
.chat-pane {
  width: 650px; /* Fixed width for the chat pane */
  flex-shrink: 0; /* Prevent chat pane from shrinking */
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #444;
}
.debug-pane {
  flex-grow: 1; /* Allow debug pane to take remaining space */
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #00ff00;
  min-width: 0; /* Allow debug pane to shrink below its content size if needed */
}
.chat-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}
.message-feed {
  flex-grow: 1;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
  min-height: 0;
}
.terminal-feed {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #000;
  padding: 10px;
  border-radius: 5px;
  min-height: 0;
}
.terminal-feed pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0 0 1em 0;
}
.input-area {
  display: flex;
}
input {
  flex-grow: 1;
  margin-right: 10px;
}
.setup-bar, .controls-bar {
  display: flex;
  margin-bottom: 10px;
}
.setup-bar input, .setup-bar select, .setup-bar button {
  margin-right: 10px;
}
.crypto-prompt {
  text-align: center;
  margin-top: 50px;
  color: #888;
}
.undecrypted {
  color: #999;
  font-style: italic;
}
</style>
