<template>
  <div class="grid-container">
    <div class="chat-pane">
      <h2>SecureChat P2P</h2>

      <div class="setup-bar p-fluid p-formgrid p-grid">
        <div class="p-field p-col">
          <InputText v-model="displayName" placeholder="Display Name" @input="setupStarted = true" />
        </div>
        <div class="p-field p-col">
          <InputText v-model="passwordInput" placeholder="Shared Passphrase" @keydown.enter="finalizeKeySetup" @blur="finalizeKeySetup" @input="setupStarted = true" />
        </div>
        <div class="p-field p-col-2">
          <Dropdown v-model="crypto.activeBitLength" :options="cipherOptions" optionLabel="label" optionValue="value" />
        </div>
      </div>

      <div v-if="setupStarted || crypto.isReady" class="chat-content">
        <div v-if="plaintextModeEnabled" class="mode-banner plaintext-mode" role="status" aria-live="polite">
          <strong>Plaintext mode enabled.</strong>
          <span>Outgoing messages will be sent without encryption.</span>
        </div>
        <div v-else class="mode-banner encrypted-mode" role="status" aria-live="polite">
          <strong>Encrypted mode enabled.</strong>
          <span>Outgoing messages will be protected with the selected cipher.</span>
        </div>

        <div class="controls-bar p-mb-2 p-d-flex p-ai-center">
          <Checkbox v-model="showUndecrypted" :binary="true" />
          <label style="margin-left:8px">Show undecryptable messages</label>
        </div>

        <div class="message-feed" ref="chatFeed">
          <div v-for="(msg, index) in filteredChatHistory" :key="index" class="message-item" :class="{ 'undecrypted': !msg.decrypted }">
            <div>
              <strong>{{ msg.sender }}:</strong> <span>{{ msg.text }}</span>
            </div>
            <div class="timestamp">{{ msg.timestamp }}</div>
          </div>
        </div>

        <div class="input-area p-d-flex p-jc-between p-ai-center">
          <InputText ref="messageInputRef" v-model="messageInput" @keyup.enter="sendMessage" placeholder="Type a message..." style="flex:1; margin-right:12px" />
          <Button label="Send" icon="pi pi-send" @click="sendMessage" />
        </div>
      </div>
      <div v-else class="crypto-prompt">
        <p>Please set a display name. Leave the passphrase blank to send unencrypted messages.</p>
      </div>
    </div>

    <div class="debug-pane">
      <h3>Ciphertext Terminal</h3>
      <div class="terminal-alert" :class="plaintextModeEnabled ? 'plaintext-alert' : 'encrypted-alert'" role="alert" aria-live="assertive">
        <strong>{{ plaintextModeEnabled ? 'PLAINTEXT ALERT' : 'CIPHERTEXT ALERT' }}</strong>
        <span>
          {{
            plaintextModeEnabled
              ? 'Encryption is disabled right now. Payloads will show cipher: none and the terminal will display readable message content.'
              : 'Encryption is active. The terminal should display ciphertext, IV, and HMAC details for each message.'
          }}
        </span>
      </div>
      <div class="terminal-feed" ref="debugFeed">
        <pre v-for="(payload, index) in debugHistory" :key="index"><template v-if="payload.cipher === 'none'">
[Sender: {{ payload.senderDisplayName }} | Cipher: {{ payload.cipher }} | Timestamp: {{ payload.timestamp }}]
Plaintext: {{ payload.plaintext }}
</template><template v-else>
[Sender: {{ payload.senderDisplayName }} | Cipher: {{ payload.cipher }} | Version: {{ payload.version }} | Timestamp: {{ payload.timestamp }}]
IV: {{ payload.iv }}
HMAC: {{ payload.hmac }}
Ciphertext: {{ payload.ciphertext }}
</template></pre>
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
const showUndecrypted = ref(true)
const plaintextModeEnabled = ref(false)
const setupStarted = ref(false)
const cipherOptions = [
  { label: 'AES (128-bit)', value: 128 },
  { label: 'DES (56-bit)', value: 56 },
]

const chatFeed = ref<HTMLElement | null>(null)
const debugFeed = ref<HTMLElement | null>(null)
const messageInputRef = ref<any>(null)

const filteredChatHistory = computed(() => {
  if (showUndecrypted.value) {
    return chatHistory.value;
  }
  return chatHistory.value.filter(msg => msg.decrypted);
});

const sendMessage = () => {
  if (!messageInput.value || (!setupStarted.value && !crypto.isReady)) return
  sendP2PMessage(messageInput.value, displayName.value)
  messageInput.value = ''
}

const finalizeKeySetup = async () => {
  console.log('Finalizing key setup...');
  try {
    await crypto.setupKeys(passwordInput.value);
    plaintextModeEnabled.value = !passwordInput.value.trim()
    console.log('Key setup successful!');
  } catch (error) {
    console.error('Key setup failed:', error);
  }
};

const handleGlobalKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    return;
  }

  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && messageInputRef.value) {
    messageInputRef.value?.$el.focus();
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
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #444;
}
.debug-pane {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #00ff00;
  min-width: 0;
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
.message-item {
  margin-bottom: 10px;
  word-break: break-word;
}
.timestamp {
  font-size: 0.8em;
  color: #888;
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
  margin: 0;
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
.mode-banner,
.terminal-alert {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  line-height: 1.4;
}
.mode-banner strong,
.terminal-alert strong {
  letter-spacing: 0.05em;
}
.plaintext-mode {
  background: #3a1f00;
  color: #ffd48a;
  border-color: #ff9f1a;
}
.encrypted-mode {
  background: #10263a;
  color: #b7e3ff;
  border-color: #4aa3ff;
}
.plaintext-alert {
  background: #4a120f;
  color: #ffd1cb;
  border-color: #ff5a4f;
  box-shadow: 0 0 0 1px rgba(255, 90, 79, 0.35), 0 0 12px rgba(255, 90, 79, 0.25);
}
.encrypted-alert {
  background: #0f2418;
  color: #c9f2d6;
  border-color: #3bd16f;
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
  word-break: break-word;
}
.p-dropdown {
  width: 100%;
}

/* Mobile Responsive Layout */
@media (max-width: 768px) {
  .grid-container {
    flex-direction: column;
  }
  .chat-pane {
    border-right: none;
    border-bottom: 1px solid #444;
    padding-top: 60px;
  }
  .debug-pane {
    min-height: 300px;
  }
  .plaintext-alert {
    display: none;
  }
}
</style>
