<template>
  <div class="input-container">
    <div v-if="fileError" class="file-error-banner">
      ⚠️ {{ fileError }}
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

const handleSend = () => {
  if (!textInput.value.trim()) return;
  emit('send', textInput.value);
  textInput.value = '';
  fileError.value = null;
};

const triggerFilePicker = () => {
  fileError.value = null;
  fileInputRef.value?.click();
};

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    fileError.value = `File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size of 25 MB.`;
    target.value = '';
    return;
  }

  emit('sendFile', file);
  target.value = '';
  fileError.value = null;
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
});
</script>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-area {
  display: flex;
}

.file-attach-btn {
  margin-right: 4px;
}

.file-error-banner {
  background-color: #5a1a1a;
  color: #ff8888;
  border: 1px solid #aa3333;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
}
</style>

