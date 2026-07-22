<template>
  <div class="banner-wrapper">
    <div v-if="connectionStatus === 'reconnecting'" class="mode-banner reconnecting-mode" role="status" aria-live="polite">
      <strong>Network Warning: Reconnecting...</strong>
      <span>Connection lost. Automatically attempting to reconnect...</span>
    </div>
    <div v-else-if="connectionStatus === 'disconnected'" class="mode-banner disconnected-mode" role="status" aria-live="polite">
      <strong>Network Disconnected</strong>
      <span>Unable to reach signaling server. Please check your network.</span>
    </div>

    <div v-if="!isEncrypted" class="mode-banner plaintext-mode" role="status" aria-live="polite">
      <strong>Plaintext mode enabled.</strong>
      <span>Outgoing messages will be sent without encryption.</span>
    </div>
    <div v-else class="mode-banner encrypted-mode" role="status" aria-live="polite">
      <strong>Encrypted mode enabled.</strong>
      <span>Outgoing messages will be protected with the selected cipher.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConnectionStatus } from '@/services/p2pManager';

defineProps<{
  isEncrypted: boolean;
  connectionStatus?: ConnectionStatus;
}>();
</script>

<style scoped>
.banner-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.mode-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  line-height: 1.4;
}
.mode-banner strong {
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
.reconnecting-mode {
  background: #3d3400;
  color: #fff1a8;
  border-color: #ffd700;
}
.disconnected-mode {
  background: #4a120f;
  color: #ffd1cb;
  border-color: #ff5a4f;
}
</style>
