<template>
  <div
    class="app-viewport"
    ref="containerRef"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <transition name="drawer-fade">
      <div v-if="isDraggingFile" class="drag-drop-overlay panel">
        <div class="drag-drop-card fade-in">
          <UploadCloud class="drag-drop-icon" :size="48" />
          <h2>Drop file to send</h2>
          <p>Peer-to-peer transfer (max 25 MB)</p>
        </div>
      </div>
    </transition>

    <header class="app-header panel">
      <div class="brand">
        <div class="brand-icon">
          <Shield :size="20" />
        </div>
        <div class="brand-titles">
          <h1 class="brand-title">SecureChat P2P</h1>
          <span class="brand-sub">WebRTC</span>
        </div>
      </div>

      <div class="header-status-pills" v-if="!shouldUseDrawerSettings">
        <div class="badge" :class="crypto.isEncrypted ? 'badge-encrypted' : 'badge-plain'">
          <Lock v-if="crypto.isEncrypted" :size="14" :class="{ 'bounce-lock': isLockBouncing }" />
          <Unlock v-else :size="14" :class="{ 'unlock-shake': isUnlockShaking }" />
          <span>{{ crypto.isEncrypted ? `${crypto.activeBitLength === 128 ? 'AES-128' : 'DES-56'}` : 'PLAINTEXT' }}</span>
        </div>
      </div>

      <div class="header-controls">
        <Button
          class="btn-layout btn-theme"
          v-tooltip.top="currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          @click="toggleTheme"
        >
          <transition name="sun-moon" mode="out-in">
            <Sun v-if="currentTheme === 'dark'" key="sun" :size="16" />
            <Moon v-else key="moon" :size="16" />
          </transition>
        </Button>

        <div class="layout-switcher">
          <div class="switcher-indicator" :style="indicatorStyle"></div>
          <Button
            class="btn-layout"
            :class="{ active: strategyType === 'auto' }"
            v-tooltip.top="'Auto Adapt Layout'"
            @click="setStrategy('auto')"
          >
            <Bolt :size="16" />
          </Button>
          <Button
            class="btn-layout"
            :class="{ active: strategyType === 'split' }"
            v-tooltip.top="'Dual-Pane Split'"
            @click="setStrategy('split')"
          >
            <Columns2 :size="16" />
          </Button>
          <Button
            class="btn-layout"
            :class="{ active: strategyType === 'tabbed' }"
            v-tooltip.top="'Tabbed Single-Pane'"
            @click="setStrategy('tabbed')"
          >
            <Smartphone :size="16" />
          </Button>
        </div>

        <Button
          v-if="shouldUseDrawerSettings"
          class="settings-toggle-btn"
          :class="{ active: isSettingsOpen }"
          v-tooltip.top="'Security Setup'"
          @click="toggleSettings"
        >
          <Settings :size="16" />
        </Button>
      </div>
    </header>

    <main class="app-body">
      <transition name="drawer-fade">
        <div v-if="shouldUseDrawerSettings && isSettingsOpen" class="settings-drawer-overlay" @click.self="closeSettings">
          <div class="settings-drawer panel fade-in">
            <div class="drawer-header">
              <h3><Sliders :size="16" /> Security Setup</h3>
              <Button class="close-drawer-btn" v-tooltip.top="'Close Setup'" @click="closeSettings">
                <X :size="16" />
              </Button>
            </div>

            <SetupBar
              v-model:displayName="displayName"
              v-model:passwordInput="passwordInput"
              v-model:activeBitLength="crypto.activeBitLength"
              :compact="true"
              @setupFinalized="onSetupDone"
              @inputStarted="isSetup = true"
            />
          </div>
        </div>
      </transition>

      <div v-if="!shouldUseDrawerSettings" class="desktop-setup-wrapper">
        <SetupBar
          v-model:displayName="displayName"
          v-model:passwordInput="passwordInput"
          v-model:activeBitLength="crypto.activeBitLength"
          @setupFinalized="saveKeys"
          @inputStarted="isSetup = true"
        />
      </div>

      <div v-if="showSideBySide" class="dual-pane-container">
        <div class="chat-pane panel">
          <ModeBanner :isEncrypted="crypto.isEncrypted" :connectionStatus="connectionStatus" :pendingCount="pendingCount" />
          <MessageFeed
            :chatHistory="chatHistory"
            v-model:showUndecrypted="showUndecrypted"
          />
          <MessageInput :quota-used="quotaUsed" :quota-max="quotaMax" @send="sendMessage" @sendFile="handleSendFile" />
        </div>

        <div class="terminal-pane">
          <CipherTerminal :debugHistory="debugHistory" />
        </div>
      </div>

      <div v-else class="tabbed-container">
        <div v-show="activeTab === 'chat'" class="chat-pane panel">
          <ModeBanner :isEncrypted="crypto.isEncrypted" :connectionStatus="connectionStatus" :pendingCount="pendingCount" />
          <MessageFeed
            :chatHistory="chatHistory"
            v-model:showUndecrypted="showUndecrypted"
          />
          <MessageInput :quota-used="quotaUsed" :quota-max="quotaMax" @send="sendMessage" @sendFile="handleSendFile" />
        </div>

        <div v-show="activeTab === 'terminal'" class="terminal-pane">
          <CipherTerminal :debugHistory="debugHistory" />
        </div>
      </div>
    </main>

    <!-- Mobile Navigation Bar -->
    <nav v-if="showTabNavigation" class="bottom-nav glass-panel">
      <button
        class="nav-tab"
        :class="{ active: activeTab === 'chat' }"
        @click="setActiveTab('chat')"
      >
        <MessageSquare :size="18" />
        <span>Chat</span>
      </button>

      <button
        class="nav-tab"
        :class="{ active: activeTab === 'terminal' }"
        @click="setActiveTab('terminal')"
      >
        <div class="tab-icon-wrapper">
          <Terminal :size="18" />
          <span v-if="unreadTerminalLogs > 0" class="unread-badge">{{ unreadTerminalLogs }}</span>
        </div>
        <span>Terminal</span>
      </button>

      <button
        class="nav-tab"
        :class="{ active: isSettingsOpen }"
        @click="toggleSettings"
      >
        <Shield :size="18" />
        <span>Keys</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useCryptoStore } from '@/stores/crypto';
import { useP2P } from '@/composables/useP2P';
import { useLayoutMediator } from '@/composables/useLayoutMediator';
import { useTheme } from '@/composables/useTheme';
import SetupBar from '@/components/chat/SetupBar.vue';
import ModeBanner from '@/components/chat/ModeBanner.vue';
import MessageFeed from '@/components/chat/MessageFeed.vue';
import MessageInput from '@/components/chat/MessageInput.vue';
import CipherTerminal from '@/components/chat/CipherTerminal.vue';
import {
  UploadCloud,
  Shield,
  Lock,
  Unlock,
  Sun,
  Moon,
  Settings,
  Sliders,
  X,
  MessageSquare,
  Terminal,
  Bolt,
  Columns2,
  Smartphone,
} from '@lucide/vue';

const crypto = useCryptoStore();
const { sendP2PMessage, sendP2PFile, chatHistory, debugHistory, connectionStatus, pendingCount, quotaUsed, quotaMax } = useP2P();
const { currentTheme, toggleTheme } = useTheme();

const {
  containerRef,
  strategyType,
  activeTab,
  isSettingsOpen,
  unreadTerminalLogs,
  showSideBySide,
  showTabNavigation,
  shouldUseDrawerSettings,
  setStrategy,
  setActiveTab,
  toggleSettings,
  closeSettings,
  incrementTerminalUnread,
  windowAdapter,
} = useLayoutMediator();

const indicatorStyle = computed(() => {
  let offsetIndex = 0;
  if (strategyType.value === 'split') offsetIndex = 1;
  else if (strategyType.value === 'tabbed') offsetIndex = 2;
  return {
    transform: `translateX(${offsetIndex * 1.875}rem)`
  };
});

const isLockBouncing = ref(false);
const isUnlockShaking = ref(false);
let lockTimer: ReturnType<typeof setTimeout> | null = null;
let unlockTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => crypto.isEncrypted,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      if (lockTimer) clearTimeout(lockTimer);
      isLockBouncing.value = true;
      lockTimer = setTimeout(() => {
        isLockBouncing.value = false;
        lockTimer = null;
      }, 650);
    } else if (!newVal && oldVal) {
      if (unlockTimer) clearTimeout(unlockTimer);
      isUnlockShaking.value = true;
      unlockTimer = setTimeout(() => {
        isUnlockShaking.value = false;
        unlockTimer = null;
      }, 650);
    }
  }
);

onUnmounted(() => {
  if (lockTimer) clearTimeout(lockTimer);
  if (unlockTimer) clearTimeout(unlockTimer);
});

const passwordInput = ref('');
const displayName = ref('Anonymous');
const showUndecrypted = ref(true);
const isSetup = ref(true);

const isDraggingFile = ref(false);
let dragCounter = 0;

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
    dragCounter++;
    isDraggingFile.value = true;
  }
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDraggingFile.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  isDraggingFile.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && files[0]) {
    handleSendFile(files[0]);
  }
};

const sendMessage = (text: string) => {
  if (!text) return;
  const nameToUse = displayName.value.trim() || 'User';
  sendP2PMessage(text, nameToUse);
};

const handleSendFile = (file: File) => {
  if (!file) return;
  const nameToUse = displayName.value.trim() || 'User';
  sendP2PFile(file, nameToUse);
};

const saveKeys = () => {
  try {
    crypto.setupKeys(passwordInput.value);
  } catch (error) {
    console.error('Key setup failed:', error);
  }
};

const onSetupDone = () => {
  saveKeys();
  closeSettings();
};

watch(
  () => debugHistory.value.length,
  () => {
    incrementTerminalUnread();
    windowAdapter.emitStatusUpdate({
      connectionStatus: connectionStatus.value,
      isEncrypted: crypto.isEncrypted,
      unreadCount: 0,
      unreadDebugCount: unreadTerminalLogs.value,
    });
  }
);
</script>

<style scoped>
.app-viewport {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-dark-root);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
}

/* Drag and Drop Full Screen Overlay */
.drag-drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.drag-drop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  border: 2px dashed var(--accent-cyan);
  border-radius: var(--radius-xl);
  background: var(--bg-glass-card);
  box-shadow: var(--shadow-glow-cyan);
  text-align: center;
}

.drag-drop-icon {
  font-size: 3.5rem;
  color: var(--accent-cyan);
  animation: status-pulse 1.5s infinite ease-in-out;
}

.drag-drop-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.drag-drop-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* App Header Bar */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  background: var(--bg-glass-header);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: var(--glass-backdrop-filter);
  z-index: 10;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  background: var(--accent-cyan);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow-cyan);
}

.brand-titles {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
}

.brand-sub {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
}

.header-status-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-mono);
}

.badge-encrypted {
  background: var(--pill-encrypted-bg);
  color: var(--pill-encrypted-text);
  border: 1px solid var(--pill-encrypted-border);
}

.badge-plain {
  background: var(--pill-plaintext-bg);
  color: var(--pill-plaintext-text);
  border: 1px solid var(--pill-plaintext-border);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-switcher {
  display: flex;
  position: relative;
  background: var(--bg-glass-input);
  padding: 0.15rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.switcher-indicator {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1.875rem;
  height: 1.875rem;
  background: var(--accent-cyan);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-glow-cyan);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.btn-layout {
  position: relative;
  z-index: 2;
  background: transparent !important;
  border: none;
  color: var(--text-muted);
  width: 1.875rem;
  height: 1.875rem;
  padding: 0 !important;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, transform 0.08s ease-in-out;
}

.btn-layout:active, .settings-toggle-btn:active {
  transform: scale(0.92);
  transition: transform 0.08s ease-in-out;
}

.btn-layout:hover {
  color: var(--text-primary);
}

.btn-layout.active {
  color: var(--text-inverse) !important;
  background: transparent !important;
  box-shadow: none !important;
}

.btn-theme {
  border: 1px solid var(--border-subtle);
  background: var(--bg-glass-input);
  overflow: hidden;
  position: relative;
}

.btn-theme:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan-glow);
}

.sun-moon-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease-in;
}

.sun-moon-enter-active {
  transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1), opacity 0.2s ease-out;
}

.sun-moon-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.sun-moon-leave-to {
  transform: translateY(26px) !important;
  opacity: 0;
}

.sun-moon-enter-from {
  transform: translateY(26px) !important;
  opacity: 0;
}

.sun-moon-enter-to {
  transform: translateY(0) !important;
  opacity: 1;
}

.settings-toggle-btn {
  background: var(--bg-glass-input);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  width: 2.125rem;
  height: 2.125rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.settings-toggle-btn:hover, .settings-toggle-btn.active {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: var(--shadow-glow-cyan);
}

/* App Main Body */
.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.desktop-setup-wrapper {
  flex-shrink: 0;
}

.dual-pane-container {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

.chat-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.875rem;
  min-width: 0;
  height: 100%;
}

.terminal-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.tabbed-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

/* Settings Drawer Popover (Mobile & Mini Window) */
.settings-drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-modal-backdrop);
  backdrop-filter: blur(8px);
  z-index: 20;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
}

.settings-drawer {
  width: 100%;
  max-width: 480px;
  background: var(--bg-dark-surface);
  border: 1px solid var(--accent-cyan-glow);
  padding: 1rem;
  box-shadow: var(--shadow-glass);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-drawer-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.close-drawer-btn:hover {
  color: var(--text-primary);
}

/* Bottom Tab Navigation Bar */
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 3.5rem;
  background: var(--bg-glass-header);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  z-index: 10;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.725rem;
  font-weight: 500;
  cursor: pointer;
  height: 100%;
  transition: var(--transition-fast);
}

.nav-tab i {
  font-size: 1.1rem;
}

.nav-tab:hover, .nav-tab.active {
  color: var(--accent-cyan);
}

.tab-icon-wrapper {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background: var(--accent-rose);
  color: var(--text-inverse);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-full);
}

.drawer-fade-enter-active, .drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-from, .drawer-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .brand-badge { display: none; }
  .header-status-pills { display: none; }
  .app-header { padding: 0.5rem 0.75rem; }
  .app-body { padding: 0.5rem; }
}
</style>
