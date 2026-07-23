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
        <i class="pi pi-comments empty-icon"></i>
        <span>No messages in connection feed yet.</span>
      </div>

      <div
        v-for="(msg, index) in filteredChatHistory"
        :key="msg.id || index"
        class="message-wrapper animate-fade-in"
        :class="{ 'undecrypted': !msg.decrypted }"
      >
        <div class="avatar-icon">
          {{ getAvatarInitial(msg.sender) }}
        </div>

        <div class="bubble-card">
          <div class="bubble-header">
            <span class="sender-name">{{ msg.sender }}</span>
            <span class="timestamp">{{ msg.timestamp }}</span>
          </div>

          <div class="message-text" v-if="msg.text">
            {{ msg.text }}
          </div>

          <!-- Render File / Media Attachment -->
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
            <i class="pi pi-lock"></i> Undecryptable Payload
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
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
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid var(--accent-cyan-glow);
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.bubble-card {
  flex: 1;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.875rem;
  word-break: break-word;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}

.sender-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--accent-cyan);
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
  background: rgba(244, 63, 94, 0.08);
  border-color: rgba(244, 63, 94, 0.3);
}

.undecrypted .sender-name {
  color: #fda4af;
}

.undecrypted-badge {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #fda4af;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
