<template>
  <div class="setup-bar p-fluid p-formgrid p-grid">
    <div class="p-field p-col">
      <InputText
        :model-value="displayName"
        @update:model-value="$emit('update:displayName', $event)"
        placeholder="Display Name"
        @input="$emit('inputStarted')"
      />
    </div>
    <div class="p-field p-col">
      <InputText
        :model-value="passwordInput"
        @update:model-value="$emit('update:passwordInput', $event)"
        placeholder="Shared Passphrase"
        @keydown.enter="$emit('setupFinalized')"
        @blur="$emit('setupFinalized')"
        @input="$emit('inputStarted')"
      />
    </div>
    <div class="p-field p-col-2">
      <Dropdown
        :model-value="activeBitLength"
        @update:model-value="$emit('update:activeBitLength', $event)"
        :options="cipherOptions"
        optionLabel="label"
        optionValue="value"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  displayName: string;
  passwordInput: string;
  activeBitLength: 128 | 56;
}>();

defineEmits<{
  (e: 'update:displayName', val: string): void;
  (e: 'update:passwordInput', val: string): void;
  (e: 'update:activeBitLength', val: 128 | 56): void;
  (e: 'setupFinalized'): void;
  (e: 'inputStarted'): void;
}>();

const cipherOptions = [
  { label: 'AES (128-bit)', value: 128 },
  { label: 'DES (56-bit)', value: 56 }
];
</script>

<style scoped>
.setup-bar {
  display: flex;
  margin-bottom: 10px;
}
.setup-bar input,
.setup-bar select,
.setup-bar button {
  margin-right: 10px;
}
</style>
