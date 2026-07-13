<template>
  <div class="grid-container">
    <!-- LEFT PANE: Plaintext Chat & Controls -->
    <div class="chat-pane">
      <h2>SecureChat P2P</h2>

      <!-- Crypto Setup Area -->
      <div class="setup-bar" v-if="!crypto.isReady">
        <input v-model="passwordInput" type="password" placeholder="Shared Passphrase" />
        <select v-model="crypto.activeBitLength">
          <option :value="128">AES (128-bit)</option>
          <option :value="56">DES (56-bit)</option>
        </select>
        <button @click="crypto.setupKeys(passwordInput)">Set Keys</button>
      </div>

      <!-- Connection & Chat Feed -->
      <div v-else>
        <button @click="startCall">Connect to Peer</button>

        <div class="message-feed" ref="chatFeed">
          <div v-for="(msg, index) in chatHistory" :key="index">
            <strong>{{ msg.sender }}:</strong> {{ msg.text }}
          </div>
        </div>

        <div class="input-area">
          <input
            v-model="messageInput"
            @keyup.enter="sendMessage"
            placeholder="Type a message..."
          />
          <button @click="sendMessage">Send</button>
        </div>
      </div>
    </div>

    <!-- RIGHT PANE: Ciphertext Debug Terminal -->
    <div class="debug-pane">
      <h3>Ciphertext Terminal</h3>
      <div class="terminal-feed" ref="debugFeed">
        <pre v-for="(payload, index) in debugHistory" :key="index">
          [Cipher: {{ payload.cipher }} | Version: {{ payload.version }}]
          IV: {{ payload.iv }}
          HMAC: {{ payload.hmac }}
          Ciphertext: {{ payload.ciphertext }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useCryptoStore } from '@/stores/crypto'
import { useP2P } from '@/composables/useP2P'

const crypto = useCryptoStore()
const { startCall, sendP2PMessage, chatHistory, debugHistory } = useP2P()

const passwordInput = ref('')
const messageInput = ref('')

const chatFeed = ref<HTMLElement | null>(null)
const debugFeed = ref<HTMLElement | null>(null)

const sendMessage = () => {
  if (!messageInput.value) return
  sendP2PMessage(messageInput.value)
  messageInput.value = ''
}

// Watch for changes and scroll to the bottom
watch(chatHistory, async () => {
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
/* Minimalist Layout */
.grid-container {
  display: flex;
  height: 100vh;
  font-family: monospace;
}
.chat-pane,
.debug-pane {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-height: 100vh; /* Ensure panes don't exceed viewport height */
}
.debug-pane {
  background-color: #1e1e1e;
  color: #00ff00;
}
.message-feed,
.terminal-feed {
  flex-grow: 1;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
}
.input-area {
  display: flex;
}
input {
  flex-grow: 1;
  margin-right: 10px;
}
</style>
