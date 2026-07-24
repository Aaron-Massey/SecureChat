<template>
  <div class="debug-pane">
    <h3>Ciphertext Terminal</h3>
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
  padding: 1.25rem;
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
  padding: 0.625rem;
  border-radius: 0.3125rem;
  min-height: 0;
}
.terminal-feed pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

@media (max-width: 48rem) {
  .debug-pane {
    min-height: 18.75rem;
  }
}
</style>
