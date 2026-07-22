<template>
  <div class="input-area p-d-flex p-jc-between p-ai-center">
    <InputText
      ref="messageInputRef"
      v-model="textInput"
      @keyup.enter="handleSend"
      placeholder="Type a message..."
      style="flex:1; margin-right:12px"
    />
    <Button label="Send" icon="pi pi-send" @click="handleSend" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  (e: 'send', text: string): void;
}>();

const textInput = ref('');
const messageInputRef = ref<any>(null);

const handleSend = () => {
  if (!textInput.value.trim()) return;
  emit('send', textInput.value);
  textInput.value = '';
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
.input-area {
  display: flex;
}
</style>
