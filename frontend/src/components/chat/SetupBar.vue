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
  align-items: center;
  margin-bottom: 0.625rem;
}

.setup-bar input,
.setup-bar select,
.setup-bar button {
  margin-right: 0.625rem;
}

:deep(.p-inputtext),
:deep(.p-dropdown) {
  height: 2.375rem;
  box-sizing: border-box;
}

:deep(.p-dropdown) {
  display: inline-flex;
  align-items: center;
}

:deep(.p-dropdown .p-dropdown-label) {
  display: flex;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
  height: 100%;
}
</style>
