<template>
  <div class="setup-container">
    <!-- Inline Quick Bar (Full Width & Header Integration) -->
    <div class="setup-bar glass-panel" :class="{ 'compact-mode': compact }">
      <div class="field-group">
        <div class="input-wrapper">
          <i class="pi pi-user input-icon"></i>
          <InputText
            :model-value="displayName"
            @update:model-value="$emit('update:displayName', $event ?? '')"
            placeholder="Display Name"
            class="cyber-input"
            @input="$emit('inputStarted')"
          />
        </div>
      </div>

      <div class="field-group">
        <div class="input-wrapper">
          <i class="pi pi-lock input-icon"></i>
          <InputText
            :model-value="passwordInput"
            @update:model-value="$emit('update:passwordInput', $event ?? '')"
            type="password"
            placeholder="Passphrase (leave empty for plaintext)"
            class="cyber-input"
            @keydown.enter="$emit('setupFinalized')"
            @blur="$emit('setupFinalized')"
            @input="$emit('inputStarted')"
          />
        </div>
      </div>

      <div class="field-group cipher-select-group">
        <Dropdown
          :model-value="activeBitLength"
          @update:model-value="$emit('update:activeBitLength', $event); $emit('setupFinalized')"
          :options="cipherOptions"
          optionLabel="label"
          optionValue="value"
          class="cyber-dropdown"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props & Emits for SetupBar

defineProps<{
  displayName: string;
  passwordInput: string;
  activeBitLength: 128 | 56;
  compact?: boolean;
}>();

defineEmits<{
  (e: 'update:displayName', val: string): void;
  (e: 'update:passwordInput', val: string): void;
  (e: 'update:activeBitLength', val: 128 | 56): void;
  (e: 'setupFinalized'): void;
  (e: 'inputStarted'): void;
}>();

const cipherOptions = [
  { label: 'AES-128', value: 128 },
  { label: 'DES-56', value: 56 }
];
</script>

<style scoped>
.setup-container {
  width: 100%;
  margin-bottom: 0.75rem;
}

.setup-bar {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: var(--bg-glass-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: var(--glass-backdrop-filter);
  box-shadow: var(--shadow-glass);
}

.field-group {
  flex: 1;
  min-width: 0;
}

.cipher-select-group {
  flex: 0 0 160px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--accent-cyan);
  font-size: 0.9rem;
  z-index: 1;
  pointer-events: none;
}

:deep(.cyber-input) {
  width: 100%;
  padding-left: 2.25rem !important;
  background: var(--bg-glass-input) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-primary) !important;
  height: 2.375rem;
}

:deep(.cyber-input:focus) {
  border-color: var(--accent-cyan) !important;
  box-shadow: 0 0 10px var(--accent-cyan-glow) !important;
}

:deep(.cyber-dropdown) {
  width: 100%;
  height: 2.375rem;
  background: var(--bg-glass-input) !important;
  border: 1px solid var(--border-subtle) !important;
}

:deep(.cyber-dropdown .p-dropdown-label) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

.apply-btn {
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(16, 185, 129, 0.2)) !important;
  border: 1px solid var(--accent-cyan) !important;
  color: var(--text-primary) !important;
  font-size: 0.85rem !important;
  white-space: nowrap;
  height: 2.375rem;
}

.apply-btn:hover {
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.4), rgba(16, 185, 129, 0.4)) !important;
  box-shadow: var(--shadow-glow-cyan) !important;
}

/* Compact / Mobile view stacking */
.compact-mode {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.75rem;
}

.compact-mode .cipher-select-group {
  flex: auto;
}

@media (max-width: 640px) {
  .setup-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .cipher-select-group {
    flex: auto;
  }
}
</style>
