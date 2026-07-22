<template>
  <div v-if="!isEncrypted" class="mode-banner plaintext-mode" role="status" aria-live="polite">
    <strong>Plaintext mode enabled.</strong>
    <span>Outgoing messages will be sent without encryption.</span>
  </div>
  <div v-else class="mode-banner encrypted-mode" role="status" aria-live="polite">
    <strong>Encrypted mode enabled.</strong>
    <span>Outgoing messages will be protected with the selected cipher.</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isEncrypted: boolean;
}>();
</script>

<style scoped>
.mode-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
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
</style>
