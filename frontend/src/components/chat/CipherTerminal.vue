<template>
  <div class="debug-pane panel" role="region" aria-label="Payload Log Stream Panel">
    <div class="terminal-header">
      <div class="window-controls" aria-hidden="true">
        <span class="control-dot red"></span>
        <span class="control-dot yellow"></span>
        <span class="control-dot green"></span>
      </div>
      <div class="terminal-title">
        <Terminal class="terminal-icon" :size="14" aria-hidden="true" />
        <span>PAYLOAD LOG STREAM</span>
      </div>
      <div class="terminal-actions">
        <button class="action-btn" title="Clear Terminal Logs" aria-label="Clear payload terminal logs" @click="clearLogs">
          <Trash2 :size="14" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="terminal-feed" ref="debugFeedRef" role="log" aria-live="polite" aria-label="Payload log stream traffic">
      <div v-if="filteredDebugHistory.length === 0" class="empty-terminal" aria-label="Terminal ready for traffic">
        <span class="blink-cursor" aria-hidden="true">></span> Ready for traffic...
      </div>

      <div
        v-for="(payload, index) in filteredDebugHistory"
        :key="index"
        class="payload-card"
        :class="payload.cipher === 'none' ? 'plaintext-card' : 'encrypted-card'"
        role="article"
        :aria-label="`Payload entry ${index + 1}: ${payload.cipher} from ${payload.senderDisplayName || 'Unknown'}`"
      >
        <div class="payload-header">
          <div class="meta-tags">
            <span class="cipher-badge" :class="payload.cipher" :aria-label="`Cipher mode: ${payload.cipher}`">
              {{ payload.cipher === 'none' ? 'PLAINTEXT' : payload.cipher.toUpperCase() }}
            </span>
            <span class="sender-tag">User: {{ payload.senderDisplayName || 'Unknown' }}</span>
            <span v-if="payload.version" class="version-tag">v{{ payload.version }}</span>
          </div>
          <div class="header-right">
            <span class="timestamp-tag">{{ payload.timestamp }}</span>
            <button class="copy-btn" title="Copy raw payload JSON" aria-label="Copy raw payload JSON" @click="copyPayload(payload)">
              <Copy :size="14" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="payload-body">
          <template v-if="payload.cipher === 'none'">
            <div class="field-line"><span class="field-label">PLAINTEXT:</span> <span class="field-val plaintext-val">{{ payload.plaintext }}</span></div>
          </template>
          <template v-else>
            <div class="field-line" v-if="payload.iv"><span class="field-label">IV:</span> <span class="field-val iv-val">{{ payload.iv }}</span></div>
            <div class="field-line" v-if="payload.hmac"><span class="field-label">HMAC:</span> <span class="field-val hmac-val">{{ payload.hmac }}</span></div>
            <div class="field-line" v-if="payload.ciphertext"><span class="field-label">CIPHERTEXT:</span> <span class="field-val ciphertext-val">{{ payload.ciphertext }}</span></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { Terminal, Trash2, Copy } from '@lucide/vue';
import type { SecurePayload } from '@shared/types/payload';
import { copyToClipboard } from '@/utils/copyToClipboard';

const props = defineProps<{
  debugHistory: SecurePayload[];
}>();

const debugFeedRef = ref<HTMLElement | null>(null);
const localClearedCount = ref(0);

const filteredDebugHistory = computed(() => {
  return props.debugHistory.slice(localClearedCount.value);
});

const clearLogs = () => {
  localClearedCount.value = props.debugHistory.length;
};

const copyPayload = async (payload: SecurePayload) => {
  const success = await copyToClipboard(JSON.stringify(payload, null, 2));
  if (!success) {
    console.error('Failed to copy payload to clipboard.');
  }
};

watch(
  () => props.debugHistory.length,
  async () => {
    await nextTick();
    if (debugFeedRef.value) {
      debugFeedRef.value.scrollTop = debugFeedRef.value.scrollHeight;
    }
  }
);
</script>

<style scoped>
.debug-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-dark-root);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-width: 0;
  height: 100%;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: var(--terminal-header-bg);
  border-bottom: 1px solid var(--border-subtle);
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.control-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
}

.control-dot.red { background: var(--accent-rose); }
.control-dot.yellow { background: var(--accent-amber); }
.control-dot.green { background: var(--accent-emerald); }

.terminal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.05em;
}

.terminal-icon {
  font-size: 0.85rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.action-btn:hover {
  color: var(--accent-rose);
  background: var(--alert-danger-bg);
}

.terminal-feed {
  flex: 1;
  overflow-y: auto;
  padding: 0.875rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  background: var(--terminal-bg);
  min-height: 0;
}

.empty-terminal {
  color: var(--text-muted);
  padding: 1rem 0;
  font-family: var(--font-mono);
}

.blink-cursor {
  color: var(--accent-cyan);
  animation: status-pulse 1s infinite;
}

.payload-card {
  background: var(--bg-glass-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.75rem;
  box-shadow: var(--shadow-glass);
}

.encrypted-card {
  border-left: 3px solid var(--accent-cyan);
}

.plaintext-card {
  border-left: 3px solid var(--accent-amber);
}

.payload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--border-subtle);
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cipher-badge {
  font-size: 0.675rem;
  font-weight: 700;
  padding: 0.1rem 0.375rem;
  border-radius: var(--radius-xs);
}

.cipher-badge.none {
  background: var(--pill-plaintext-bg);
  color: var(--pill-plaintext-text);
  border: 1px solid var(--pill-plaintext-border);
}

.cipher-badge.AES-128, .cipher-badge.DES-56 {
  background: var(--pill-encrypted-bg);
  color: var(--pill-encrypted-text);
  border: 1px solid var(--pill-encrypted-border);
}

.sender-tag {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.version-tag {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timestamp-tag {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.copy-btn:hover {
  color: var(--accent-cyan);
}

.payload-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  word-break: break-all;
}

.field-line {
  display: flex;
  gap: 0.5rem;
  line-height: 1.4;
}

.field-label {
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
  min-width: 80px;
}

.field-val {
  color: var(--text-primary);
}

.iv-val { color: var(--accent-purple); }
.hmac-val { color: var(--accent-emerald); }
.ciphertext-val { color: var(--accent-cyan); }
.plaintext-val { color: var(--accent-amber); }
</style>
