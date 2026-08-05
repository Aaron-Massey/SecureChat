<template>
  <div class="input-container" role="region" aria-label="Message Input Area">
    <div class="toast-expand-wrapper" :class="{ 'is-expanded': !!fileError }">
      <div class="toast-expand-inner">
        <transition name="toast-fade">
          <div v-if="fileError" class="file-error-toast" role="alert" aria-live="assertive">
            <span class="toast-message">⚠️ {{ fileError }}</span>
            <button type="button" class="toast-close-btn" @click="dismissToast" title="Dismiss notification" aria-label="Dismiss error notification">✕</button>
          </div>
        </transition>
      </div>
    </div>

    <div class="input-area panel" role="form" aria-label="Send message input form">
      <input
        type="file"
        ref="fileInputRef"
        style="display: none"
        aria-hidden="true"
        @change="handleFileSelected"
      />

      <!-- Voice Recording Active UI -->
      <template v-if="isRecording">
        <div class="recording-bar" role="status" aria-live="polite">
          <span class="recording-dot" aria-hidden="true"></span>
          <span class="recording-label">Recording Voice...</span>
          <span class="recording-timer">{{ formatRecordingTime(durationSeconds) }}</span>
        </div>

        <Button
          class="p-button-secondary cancel-voice-btn"
          title="Cancel Voice Note"
          aria-label="Cancel Voice Note"
          @click="handleCancelVoiceNote"
        >
          <Trash2 :size="16" aria-hidden="true" />
        </Button>

        <Button
          class="stop-review-btn"
          title="Stop & Review Recording"
          aria-label="Stop and Review Recording"
          @click="handleStopAndReview"
        >
          <Square :size="16" style="margin-right: 0.375rem" aria-hidden="true" />
          Review
        </Button>
      </template>

      <!-- Voice Recording Preview UI -->
      <template v-else-if="previewUrl">
        <div class="voice-preview-wrapper">
          <AudioPlayer
            :src="previewUrl"
            file-name="Voice Note Preview"
            :initial-duration="recordedDuration"
            class="voice-preview-player"
          />
        </div>

        <Button
          class="p-button-secondary cancel-voice-btn"
          title="Discard Recording"
          aria-label="Discard Recording"
          @click="handleCancelVoiceNote"
        >
          <Trash2 :size="16" aria-hidden="true" />
        </Button>

        <Button
          class="send-btn send-voice-btn"
          aria-label="Send voice message"
          @click="handleConfirmSendVoiceNote"
        >
          <Send :size="16" style="margin-right: 0.375rem" aria-hidden="true" />
          Send
        </Button>
      </template>

      <!-- Standard Input UI -->
      <template v-else>
        <Button
          class="p-button-secondary file-attach-btn"
          title="Attach File (Max 100 MB)"
          aria-label="Attach File (Max 100 MB)"
          @click="triggerFilePicker"
        >
          <Paperclip :size="16" aria-hidden="true" />
        </Button>

        <Button
          class="p-button-secondary voice-record-btn"
          title="Record Voice Message"
          aria-label="Record Voice Message"
          @click="handleStartVoiceNote"
        >
          <Mic :size="16" aria-hidden="true" />
        </Button>

        <InputText
          ref="messageInputRef"
          v-model="textInput"
          @keyup.enter="handleSend"
          placeholder="Type a message..."
          aria-label="Message text input"
          class="chat-text-input"
        />

        <div
          v-if="quotaMax && quotaMax > 0"
          class="quota-indicator-wrapper"
          role="meter"
          :aria-valuenow="quotaUsed || 0"
          aria-valuemin="0"
          :aria-valuemax="quotaMax"
          :aria-label="`Message Quota: ${quotaUsed || 0} of ${quotaMax} messages used`"
          v-tooltip.top="`Message Quota: ${quotaUsed || 0} / ${quotaMax} messages used in 1-min window`"
        >
          <svg class="quota-ring" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="var(--border-subtle, rgba(255, 255, 255, 0.15))"
              stroke-width="2.5"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              :stroke="quotaColor"
              stroke-width="2.5"
              stroke-dasharray="56.548"
              :stroke-dashoffset="dashOffset"
              stroke-linecap="round"
              transform="rotate(-90 12 12)"
              class="quota-progress-circle"
            />
          </svg>
        </div>

        <Button
          class="send-btn"
          aria-label="Send message"
          @click="handleSend"
        >
          <Send :size="16" style="margin-right: 0.375rem" aria-hidden="true" />
          Send
        </Button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Paperclip, Send, Mic, Trash2, Square } from '@lucide/vue';
import { MAX_FILE_SIZE, formatFileSize } from '@/utils/fileChunker';
import { useVoiceRecorder, formatRecordingTime } from '@/composables/useVoiceRecorder';
import AudioPlayer from '@/components/chat/AudioPlayer.vue';

const props = defineProps<{
  quotaUsed?: number;
  quotaMax?: number;
}>();

const emit = defineEmits<{
  (e: 'send', text: string): void;
  (e: 'sendFile', file: File): void;
}>();

const textInput = ref('');
const fileError = ref<string | null>(null);
const messageInputRef = ref<{ $el?: HTMLInputElement; focus?: () => void } | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const {
  isRecording,
  durationSeconds,
  recordedDuration,
  recorderError,
  recordedFile,
  previewUrl,
  startRecording,
  stopRecording,
  cancelRecording,
  clearPreview,
} = useVoiceRecorder();

const quotaRatio = computed(() => {
  if (!props.quotaMax || props.quotaMax <= 0) return 0;
  return (props.quotaUsed || 0) / props.quotaMax;
});

const dashOffset = computed(() => {
  const circumference = 56.548;
  const ratio = Math.min(1, Math.max(0, quotaRatio.value));
  return circumference * (1 - ratio);
});

const quotaColor = computed(() => {
  if (quotaRatio.value >= 0.80) {
    return '#ef4444'; // Red (>= 80% used)
  }
  if (quotaRatio.value >= 0.66) {
    return '#eab308'; // Yellow (>= 66% used)
  }
  return '#94a3b8'; // Gray/White (< 66% used)
});

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const showFileToast = (msg: string) => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  fileError.value = msg;
  toastTimeout = setTimeout(() => {
    fileError.value = null;
    toastTimeout = null;
  }, 5000);
};

const dismissToast = () => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  fileError.value = null;
};

const handleSend = () => {
  if (!textInput.value.trim()) return;
  emit('send', textInput.value);
  textInput.value = '';
  dismissToast();
};

const triggerFilePicker = () => {
  dismissToast();
  fileInputRef.value?.click();
};

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    showFileToast(`File "${file.name}" (${formatFileSize(file.size)}) exceeds maximum size of 100 MB.`);
    target.value = '';
    return;
  }

  emit('sendFile', file);
  target.value = '';
  dismissToast();
};

const handleStartVoiceNote = async () => {
  dismissToast();
  const ok = await startRecording();
  if (!ok && recorderError.value) {
    showFileToast(recorderError.value);
  }
};

const handleStopAndReview = async () => {
  await stopRecording();
};

const handleCancelVoiceNote = () => {
  cancelRecording();
};

const handleConfirmSendVoiceNote = () => {
  const voiceFile = recordedFile.value;
  if (!voiceFile) return;

  if (voiceFile.size > MAX_FILE_SIZE) {
    showFileToast(`Voice note exceeds maximum size of 100 MB.`);
    return;
  }

  emit('sendFile', voiceFile);
  clearPreview();
  dismissToast();
};

const handleGlobalKeyPress = (event: KeyboardEvent) => {
  if (isRecording.value || previewUrl.value) return;
  const target = event.target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    return;
  }

  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && messageInputRef.value) {
    messageInputRef.value?.$el?.focus();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyPress);
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
});

defineExpose({
  showFileToast,
  dismissToast
});
</script>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background: var(--bg-glass-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: var(--shadow-glass);
}

.file-attach-btn,
.voice-record-btn,
.cancel-voice-btn {
  height: 2.375rem;
  width: 2.375rem;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: var(--radius-md) !important;
  flex-shrink: 0;
}

.voice-record-btn:hover {
  color: var(--accent-cyan) !important;
}

.cancel-voice-btn:hover {
  color: #ef4444 !important;
}

.recording-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0 0.75rem;
  height: 2.375rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
}

.recording-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  animation: pulse-recording 1.2s infinite ease-in-out;
}

@keyframes pulse-recording {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.recording-label {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.recording-timer {
  margin-left: auto;
  font-family: monospace;
  font-weight: 700;
  font-size: 0.9rem;
  color: #ef4444;
}

.stop-review-btn {
  height: 2.375rem;
  padding: 0 0.875rem !important;
  background: rgba(234, 179, 8, 0.15) !important;
  border: 1px solid rgba(234, 179, 8, 0.4) !important;
  color: #eab308 !important;
  font-weight: 600 !important;
  border-radius: var(--radius-md) !important;
  flex-shrink: 0;
}

.stop-review-btn:hover {
  background: rgba(234, 179, 8, 0.25) !important;
}

.voice-preview-wrapper {
  flex: 1;
  min-width: 0;
}

.chat-text-input {
  flex: 1;
  height: 2.375rem;
  padding-left: 1.125rem !important;
  border-radius: var(--radius-md) !important;
  background: var(--bg-glass-input) !important;
}

.quota-indicator-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: help;
  padding: 0 0.125rem;
}

.quota-ring {
  display: block;
}

.quota-progress-circle {
  transition: stroke-dashoffset 0.35s ease, stroke 0.35s ease;
}

.send-btn {
  height: 2.375rem;
  padding: 0 1rem !important;
  background: var(--accent-cyan) !important;
  border: none !important;
  color: var(--text-inverse) !important;
  font-weight: 700 !important;
  flex-shrink: 0;
  border-radius: var(--radius-md) !important;
  transition: var(--transition-fast);
}

.send-btn:hover {
  box-shadow: var(--shadow-glow-cyan) !important;
  opacity: 0.95;
}

.send-btn:hover svg {
  transform: translate(2px, -1px) scale(1.05);
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.send-btn:active, .file-attach-btn:active, .voice-record-btn:active {
  transform: scale(0.94);
  transition: transform 0.08s ease-in-out;
}

.toast-expand-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.toast-expand-wrapper.is-expanded {
  grid-template-rows: 1fr;
}

.toast-expand-inner {
  min-height: 0;
  overflow: hidden;
  padding-bottom: 0.375rem;
}

.file-error-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--alert-danger-bg);
  color: var(--alert-danger-text);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: var(--shadow-glass);
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: var(--alert-danger-text);
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-left: 0.625rem;
  padding: 0 0.25rem;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.toast-close-btn:hover {
  opacity: 1;
  color: var(--text-primary);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
