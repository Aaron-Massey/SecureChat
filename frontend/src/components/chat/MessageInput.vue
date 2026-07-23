<template>
  <div class="input-container">
    <div class="toast-expand-wrapper" :class="{ 'is-expanded': !!fileError }">
      <div class="toast-expand-inner">
        <transition name="toast-fade">
          <div v-if="fileError" class="file-error-toast" role="alert">
            <span class="toast-message">⚠️ {{ fileError }}</span>
            <button type="button" class="toast-close-btn" @click="dismissToast" title="Dismiss notification">✕</button>
          </div>
        </transition>
      </div>
    </div>

    <div class="input-area panel">
      <input
        type="file"
        ref="fileInputRef"
        style="display: none"
        @change="handleFileSelected"
      />

      <Button
        class="p-button-secondary file-attach-btn"
        title="Attach File (Max 25 MB)"
        @click="triggerFilePicker"
      >
        <Paperclip :size="16" />
      </Button>

      <InputText
        ref="messageInputRef"
        v-model="textInput"
        @keyup.enter="handleSend"
        placeholder="Type a message..."
        class="chat-text-input"
      />

      <Button
        class="send-btn"
        @click="handleSend"
      >
        <Send :size="16" style="margin-right: 0.375rem" />
        Send
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Paperclip, Send } from '@lucide/vue';
import { MAX_FILE_SIZE, formatFileSize } from '@/utils/fileChunker';

const emit = defineEmits<{
  (e: 'send', text: string): void;
  (e: 'sendFile', file: File): void;
}>();

const textInput = ref('');
const fileError = ref<string | null>(null);
const messageInputRef = ref<{ $el?: HTMLInputElement; focus?: () => void } | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

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
    showFileToast(`File "${file.name}" (${formatFileSize(file.size)}) exceeds maximum size of 25 MB.`);
    target.value = '';
    return;
  }

  emit('sendFile', file);
  target.value = '';
  dismissToast();
};

const handleGlobalKeyPress = (event: KeyboardEvent) => {
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

.file-attach-btn {
  height: 2.375rem;
  width: 2.375rem;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: var(--radius-md) !important;
  flex-shrink: 0;
}

.chat-text-input {
  flex: 1;
  height: 2.375rem;
  padding-left: 1.125rem !important;
  border-radius: var(--radius-md) !important;
  background: var(--bg-glass-input) !important;
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

.send-btn:active, .file-attach-btn:active {
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
