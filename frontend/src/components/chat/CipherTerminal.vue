<template>
  <div class="debug-pane">
    <h3>Ciphertext Terminal</h3>
    <div
      class="terminal-alert"
      :class="!isEncrypted ? 'plaintext-alert' : 'encrypted-alert'"
      role="alert"
      aria-live="assertive"
    >
      <strong>{{ !isEncrypted ? 'PLAINTEXT ALERT' : 'CIPHERTEXT ALERT' }}</strong>
      <span>
        {{
          !isEncrypted
            ? 'Encryption is disabled right now. Payloads will show cipher: none and the terminal will display readable message content.'
            : 'Encryption is active. The terminal should display ciphertext, IV, and HMAC details for each message.'
        }}
      </span>
    </div>
    <div class="terminal-feed" ref="debugFeedRef">
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
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { SecurePayload } from '@shared/types/payload';

const props = defineProps<{
  isEncrypted: boolean;
  debugHistory: SecurePayload[];
}>();

const debugFeedRef = ref<HTMLElement | null>(null);

watch(
  () => props.debugHistory,
  async () => {
    await nextTick();
    if (debugFeedRef.value) {
      debugFeedRef.value.scrollTop = debugFeedRef.value.scrollHeight;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.debug-pane {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #00ff00;
  min-width: 0;
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
.terminal-alert strong {
  letter-spacing: 0.05em;
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

@media (max-width: 768px) {
  .debug-pane {
    min-height: 300px;
  }
  .plaintext-alert {
    display: none;
  }
}
</style>
