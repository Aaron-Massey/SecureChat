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

    <div class="input-area p-d-flex p-jc-between p-ai-center">
      <input
        type="file"
        ref="fileInputRef"
        style="display: none"
        @change="handleFileSelected"
      />
      
      <Button
        icon="pi pi-paperclip"
        class="p-button-secondary file-attach-btn"
        title="Attach File (Max 25 MB)"
        @click="triggerFilePicker"
      />

      <InputText
        ref="messageInputRef"
        v-model="textInput"
        @keyup.enter="handleSend"
        placeholder="Type a message..."
        style="flex:1; margin: 0 12px;"
      />
      <Button label=" Send" icon="pi pi-send" @click="handleSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MAX_FILE_SIZE, formatFileSize } from '@/utils/fileChunker';

const emit = defineEmits<{
  (e: 'send', text: string): void;
  (e: 'sendFile', file: File): void;
}>();

const textInput = ref('');
const fileError = ref<string | null>(null);
const messageInputRef = ref<any>(null);
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
    showFileToast(`File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size of 25 MB.`);
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
}

.input-area {
  display: flex;
}

.file-attach-btn {
  margin-right: 0.25rem;
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
  background-color: #4a1818;
  color: #ffaaaa;
  border: 1px solid #993333;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.4);
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: #ffaaaa;
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
  color: #ffffff;
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

