<template>
  <div class="banner-wrapper">
    <div v-if="connectionStatus === 'reconnecting'" class="mode-banner reconnecting-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <RefreshCw class="banner-icon" :size="16" />
        <strong>Signaling Reconnecting...</strong>
      </div>
      <span class="banner-subtext">Connection interrupted. Re-establishing connection...</span>
    </div>

    <div v-else-if="connectionStatus === 'disconnected'" class="mode-banner disconnected-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <AlertTriangle class="banner-icon" :size="16" />
        <strong>Network Disconnected</strong>
      </div>
      <span class="banner-subtext">Signaling server unreachable. Retrying automatically...</span>
    </div>

    <div v-if="!isEncrypted" class="mode-banner plaintext-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <ShieldAlert class="banner-icon" :size="16" />
        <strong>Plaintext Mode Active</strong>
      </div>
      <span class="banner-subtext">Messages sent unencrypted. Enter a passphrase to encrypt.</span>
    </div>

    <div v-else class="mode-banner encrypted-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <Shield class="banner-icon" :size="16" />
        <strong>End-to-End Encryption Enabled</strong>
      </div>
      <span class="banner-subtext">Messages and file transfers are encrypted.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, AlertTriangle, ShieldAlert, Shield } from '@lucide/vue';
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
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mode-banner {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 0.825rem;
  backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: var(--transition-fast);
}

.banner-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.banner-header strong {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.banner-icon {
  font-size: 0.95rem;
}

.banner-subtext {
  font-size: 0.775rem;
  opacity: 0.85;
}



.plaintext-mode {
  background: var(--pill-plaintext-bg);
  color: var(--pill-plaintext-text);
  border-color: var(--pill-plaintext-border);
}

.encrypted-mode {
  background: var(--pill-encrypted-bg);
  color: var(--pill-encrypted-text);
  border-color: var(--pill-encrypted-border);
  box-shadow: var(--shadow-glow-cyan);
}

.reconnecting-mode {
  background: var(--alert-warning-bg);
  color: var(--alert-warning-text);
  border-color: var(--alert-warning-border);
}

.disconnected-mode {
  background: var(--alert-danger-bg);
  color: var(--alert-danger-text);
  border-color: var(--alert-danger-border);
}
</style>
