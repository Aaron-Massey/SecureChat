<template>
  <div class="banner-wrapper">
    <!-- Network Status Alert -->
    <div v-if="connectionStatus === 'reconnecting'" class="mode-banner reconnecting-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <span class="status-dot warning-pulse"></span>
        <strong>Signaling Reconnecting...</strong>
      </div>
      <span class="banner-subtext">Connection interrupted. Re-establishing connection...</span>
    </div>

    <div v-else-if="connectionStatus === 'disconnected'" class="mode-banner disconnected-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <span class="status-dot error-pulse"></span>
        <strong>Network Disconnected</strong>
      </div>
      <span class="banner-subtext">Signaling server unreachable. Retrying automatically...</span>
    </div>

    <!-- Encryption Mode Status Bar -->
    <div v-if="!isEncrypted" class="mode-banner plaintext-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <i class="pi pi-lock-open banner-icon"></i>
        <strong>Plaintext Mode Active</strong>
      </div>
      <span class="banner-subtext">Messages sent unencrypted across P2P channel. Enter passphrase to secure connection.</span>
    </div>

    <div v-else class="mode-banner encrypted-mode" role="status" aria-live="polite">
      <div class="banner-header">
        <i class="pi pi-shield banner-icon"></i>
        <strong>End-to-End Encryption Enabled</strong>
      </div>
      <span class="banner-subtext">Messages and media attachments are cryptographically protected.</span>
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.warning-pulse {
  background: var(--accent-amber);
  animation: status-pulse 1.2s infinite ease-in-out;
  box-shadow: 0 0 8px var(--accent-amber);
}

.error-pulse {
  background: var(--accent-rose);
  animation: status-pulse 1.2s infinite ease-in-out;
  box-shadow: 0 0 8px var(--accent-rose);
}

.plaintext-mode {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.35);
}

.encrypted-mode {
  background: rgba(0, 242, 254, 0.1);
  color: var(--accent-cyan);
  border-color: rgba(0, 242, 254, 0.3);
  box-shadow: var(--shadow-glow-cyan);
}

.reconnecting-mode {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.4);
}

.disconnected-mode {
  background: rgba(244, 63, 94, 0.15);
  color: #fda4af;
  border-color: rgba(244, 63, 94, 0.4);
}
</style>
