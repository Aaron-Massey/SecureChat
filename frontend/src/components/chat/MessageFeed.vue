<template>
  <div class="feed-container">
    <div class="controls-bar p-mb-2 p-d-flex p-ai-center">
      <Checkbox
        :model-value="showUndecrypted"
        @update:model-value="$emit('update:showUndecrypted', $event)"
        :binary="true"
      />
      <label style="margin-left:8px">Show undecryptable messages</label>
    </div>

    <div class="message-feed" ref="feedRef">
      <div
        v-for="(msg, index) in filteredChatHistory"
        :key="msg.id || index"
        class="message-item"
        :class="{ 'undecrypted': !msg.decrypted }"
      >
        <div>
          <strong>{{ msg.sender }}:</strong> <span v-if="msg.text">{{ msg.text }}</span>
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

        <div class="timestamp">{{ msg.timestamp }}</div>
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
}
.controls-bar {
  display: flex;
  margin-bottom: 10px;
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
.undecrypted {
  color: #999;
  font-style: italic;
  word-break: break-word;
}
</style>
