<template>
  <div class="feed-container">
    <div class="controls-bar">
      <div class="checkbox-wrapper">
        <Checkbox
          :model-value="showUndecrypted"
          @update:model-value="$emit('update:showUndecrypted', $event)"
          :binary="true"
          id="show-undecrypted-chk"
        />
        <label for="show-undecrypted-chk" class="chk-label" @click.prevent="$emit('update:showUndecrypted', !showUndecrypted)">
          Show undecryptable payloads
        </label>
      </div>
    </div>

    <div class="message-feed" ref="feedRef">
      <div v-if="filteredChatHistory.length === 0" class="empty-feed">
        <MessageSquare class="empty-icon" :size="36" />
        <span>No messages yet.</span>
      </div>

      <div
        v-for="(msg, index) in filteredChatHistory"
        :key="msg.id || index"
        class="message-wrapper fade-in"
        :class="{ 'undecrypted': !msg.decrypted, 'system-wrapper': isSystemMessage(msg) }"
      >
        <div class="avatar-icon" :class="{ 'system-avatar': isSystemMessage(msg) }">
          <ServerCog v-if="isSystemMessage(msg)" :size="16" />
          <template v-else>{{ getAvatarInitial(msg.sender) }}</template>
        </div>

        <div class="bubble-card" :class="{ 'system-card': isSystemMessage(msg) }">
          <div class="bubble-header">
            <div class="sender-info">
              <span class="sender-name">{{ msg.sender }}</span>
              <span v-if="isSystemMessage(msg)" class="system-badge">SYSTEM</span>
            </div>
            <span class="timestamp">{{ msg.timestamp }}</span>
          </div>

          <div class="message-text" v-if="msg.text">
            {{ msg.text }}
          </div>

          <MediaAttachment
            v-if="msg.fileAttachment && (msg.decrypted || msg.fileAttachment.isTransferring)"
            :file-name="msg.fileAttachment.fileName"
            :file-size="msg.fileAttachment.fileSize"
            :mime-type="msg.fileAttachment.mimeType"
            :media-url="msg.fileAttachment.mediaUrl || ''"
            :progress="msg.fileAttachment.progress || 0"
            :is-transferring="msg.fileAttachment.isTransferring || false"
          />

          <div v-if="!msg.decrypted" class="undecrypted-badge">
            <Lock :size="14" /> Undecryptable Payload
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { MessageSquare, Lock, ServerCog } from '@lucide/vue';
import type { ChatMessage } from '@/composables/useP2P';
import MediaAttachment from './MediaAttachment.vue';

const props = defineProps<{
  chatHistory: ChatMessage[];
  showUndecrypted: boolean;
}>();

defineEmits<{
  (e: 'update:showUndecrypted', val: boolean): void;
}>();

const feedRef = ref<HTMLElement | null>(null);

const filteredChatHistory = computed(() => {
  if (props.showUndecrypted) {
    return props.chatHistory;
  }
  return props.chatHistory.filter((msg) => msg.decrypted);
});

const isSystemMessage = (msg: ChatMessage): boolean => {
  return msg.isSystem === true;
};

const getAvatarInitial = (senderName: string): string => {
  if (!senderName) return 'A';
  return senderName.charAt(0).toUpperCase();
};

watch(
  filteredChatHistory,
  async () => {
    await nextTick();
    if (feedRef.value) {
      feedRef.value.scrollTop = feedRef.value.scrollHeight;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.feed-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  width: 100%;
}

.controls-bar {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chk-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.message-feed {
  flex-grow: 1;
  overflow-y: auto;
  background: var(--bg-glass-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 0.875rem;
  margin-bottom: 0.625rem;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: var(--shadow-glass);
}

.empty-feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: 0.5rem;
}

.empty-icon {
  font-size: 2.25rem;
  color: var(--text-muted);
  opacity: 0.5;
}

.message-wrapper {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
}

.avatar-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--avatar-default-bg);
  border: 1px solid var(--avatar-default-border);
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.system-avatar {
  background: var(--system-avatar-bg);
  border-color: var(--system-avatar-border);
  color: var(--accent-purple);
}

.bubble-card {
  flex: 1;
  background: var(--bubble-bg);
  border: 1px solid var(--bubble-border);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.875rem;
  word-break: break-word;
  box-shadow: var(--shadow-glass);
}

.system-card {
  background: var(--card-system-bg);
  border-color: var(--card-system-border);
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.sender-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--accent-cyan);
}

.system-card .sender-name {
  color: var(--accent-purple);
}

.system-badge {
  font-size: 0.6rem;
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--badge-system-bg);
  color: var(--badge-system-text);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.timestamp {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.message-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.undecrypted .bubble-card {
  background: var(--bubble-undecrypted-bg);
  border-color: var(--bubble-undecrypted-border);
}

.undecrypted .sender-name {
  color: var(--bubble-undecrypted-text);
}

.undecrypted-badge {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--bubble-undecrypted-text);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
