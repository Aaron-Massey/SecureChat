<template>
  <div
    class="app-viewport"
    ref="containerRef"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Full-Window Drag & Drop Upload Overlay -->
    <transition name="drawer-fade">
      <div v-if="isDraggingFile" class="drag-drop-overlay glass-panel">
        <div class="drag-drop-card animate-fade-in">
          <i class="pi pi-cloud-upload drag-drop-icon"></i>
          <h2>Drop File to Attach & Encrypt</h2>
          <p>End-to-End P2P File Transfer (Max 25 MB)</p>
        </div>
      </div>
    </transition>

    <!-- Cyber Top Header Navigation Bar -->
    <header class="app-header glass-panel">
      <div class="brand-section">
        <div class="brand-logo">
          <i class="pi pi-shield brand-icon"></i>
        </div>
        <div class="brand-titles">
          <h1 class="brand-name">SecureChat P2P</h1>
          <span class="brand-badge">AES/DES WEBRTC</span>
        </div>
      </div>

      <!-- Mode & Status Quick Pills -->
      <div class="header-status-pills" v-if="!shouldUseDrawerSettings">
        <div class="status-pill" :class="crypto.isEncrypted ? 'encrypted-pill' : 'plaintext-pill'">
          <i class="pi" :class="crypto.isEncrypted ? 'pi-lock' : 'pi-lock-open'"></i>
          <span>{{ crypto.isEncrypted ? `${crypto.activeBitLength === 128 ? 'AES-128' : 'DES-56'}` : 'PLAINTEXT' }}</span>
        </div>
      </div>

      <!-- Header Action Controls -->
      <div class="header-controls">
        <!-- Dark / Light Theme Toggle Button -->
        <button
          class="layout-btn theme-btn"
          :title="currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          @click="toggleTheme"
        >
          <i class="pi" :class="currentTheme === 'dark' ? 'pi-sun' : 'pi-moon'"></i>
        </button>

        <!-- Layout Mode Switcher -->
        <div class="layout-switcher">
          <button
            class="layout-btn"
            :class="{ active: strategyType === 'auto' }"
            title="Auto Adapt Layout"
            @click="setStrategy('auto')"
          >
            <i class="pi pi-desktop"></i>
          </button>
          <button
            class="layout-btn"
            :class="{ active: strategyType === 'split' }"
            title="Dual-Pane Split"
            @click="setStrategy('split')"
          >
            <i class="pi pi-th-large"></i>
          </button>
          <button
            class="layout-btn"
            :class="{ active: strategyType === 'tabbed' }"
            title="Tabbed Single-Pane"
            @click="setStrategy('tabbed')"
          >
            <i class="pi pi-window-maximize"></i>
          </button>
        </div>

        <!-- Mobile / Mini-Window Settings Drawer Toggle Button -->
        <button
          v-if="shouldUseDrawerSettings"
          class="settings-toggle-btn"
          :class="{ active: isSettingsOpen }"
          title="Security & Key Setup"
          @click="toggleSettings"
        >
          <i class="pi pi-cog"></i>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-body">
      <!-- Embedded Settings Popover Drawer (Mobile / Mini Window) -->
      <transition name="drawer-fade">
        <div v-if="shouldUseDrawerSettings && isSettingsOpen" class="settings-drawer-overlay" @click.self="closeSettings">
          <div class="settings-drawer glass-panel animate-fade-in">
            <div class="drawer-header">
              <h3><i class="pi pi-sliders-h"></i> Security Key Setup</h3>
              <button class="close-drawer-btn" @click="closeSettings">✕</button>
            </div>

            <SetupBar
              v-model:displayName="displayName"
              v-model:passwordInput="passwordInput"
              v-model:activeBitLength="crypto.activeBitLength"
              :compact="true"
              @setupFinalized="onSetupFinalized"
              @inputStarted="setupStarted = true"
            />
          </div>
        </div>
      </transition>

      <!-- Desktop Setup Bar (Inline View) -->
      <div v-if="!shouldUseDrawerSettings" class="desktop-setup-wrapper">
        <SetupBar
          v-model:displayName="displayName"
          v-model:passwordInput="passwordInput"
          v-model:activeBitLength="crypto.activeBitLength"
          @setupFinalized="finalizeKeySetup"
          @inputStarted="setupStarted = true"
        />
      </div>

      <!-- Side-by-Side Dual Pane Mode (Desktop) -->
      <div v-if="showSideBySide" class="dual-pane-container">
        <div class="chat-pane glass-panel">
          <ModeBanner :isEncrypted="crypto.isEncrypted" :connectionStatus="connectionStatus" />
          <MessageFeed
            :chatHistory="chatHistory"
            v-model:showUndecrypted="showUndecrypted"
          />
          <MessageInput @send="sendMessage" @sendFile="handleSendFile" />
        </div>

        <div class="terminal-pane">
          <CipherTerminal :debugHistory="debugHistory" />
        </div>
      </div>

      <!-- Single Pane / Tabbed Mode (Mobile & Mini Windows) -->
      <div v-else class="tabbed-container">
        <!-- Chat Tab Content -->
        <div v-show="activeTab === 'chat'" class="chat-pane glass-panel">
          <ModeBanner :isEncrypted="crypto.isEncrypted" :connectionStatus="connectionStatus" />
          <MessageFeed
            :chatHistory="chatHistory"
            v-model:showUndecrypted="showUndecrypted"
          />
          <MessageInput @send="sendMessage" @sendFile="handleSendFile" />
        </div>

        <!-- Terminal Tab Content -->
        <div v-show="activeTab === 'terminal'" class="terminal-pane">
          <CipherTerminal :debugHistory="debugHistory" />
        </div>
      </div>
    </main>

    <!-- Mobile / Compact View Bottom Tab Navigation Bar -->
    <nav v-if="showTabNavigation" class="bottom-nav glass-panel">
      <button
        class="nav-tab"
        :class="{ active: activeTab === 'chat' }"
        @click="setActiveTab('chat')"
      >
        <i class="pi pi-comments"></i>
        <span>Chat</span>
      </button>

      <button
        class="nav-tab"
        :class="{ active: activeTab === 'terminal' }"
        @click="setActiveTab('terminal')"
      >
        <div class="tab-icon-wrapper">
          <i class="pi pi-terminal"></i>
          <span v-if="unreadTerminalLogs > 0" class="unread-badge">{{ unreadTerminalLogs }}</span>
        </div>
        <span>Terminal</span>
      </button>

      <button
        class="nav-tab"
        :class="{ active: isSettingsOpen }"
        @click="toggleSettings"
      >
        <i class="pi pi-shield"></i>
        <span>Keys</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCryptoStore } from '@/stores/crypto';
import { useP2P } from '@/composables/useP2P';
import { useLayoutMediator } from '@/composables/useLayoutMediator';
import { useTheme } from '@/composables/useTheme';
import SetupBar from '@/components/chat/SetupBar.vue';
import ModeBanner from '@/components/chat/ModeBanner.vue';
import MessageFeed from '@/components/chat/MessageFeed.vue';
import MessageInput from '@/components/chat/MessageInput.vue';
import CipherTerminal from '@/components/chat/CipherTerminal.vue';

const crypto = useCryptoStore();
const { sendP2PMessage, sendP2PFile, chatHistory, debugHistory, connectionStatus } = useP2P();
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

const passwordInput = ref('');
const displayName = ref('');
const showUndecrypted = ref(true);
const setupStarted = ref(false);

/* Drag and Drop File Upload Overlay Handling */
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
  if (!text || (!setupStarted.value && !crypto.isReady)) return;
  const nameToUse = displayName.value.trim() || 'Anonymous';
  sendP2PMessage(text, nameToUse);
};

const handleSendFile = (file: File) => {
  if (!file || (!setupStarted.value && !crypto.isReady)) return;
  const nameToUse = displayName.value.trim() || 'Anonymous';
  sendP2PFile(file, nameToUse);
};

const finalizeKeySetup = () => {
  try {
    crypto.setupKeys(passwordInput.value);
  } catch (error) {
    console.error('Key setup failed:', error);
  }
};

const onSetupFinalized = () => {
  finalizeKeySetup();
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
  background: rgba(8, 12, 20, 0.85);
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

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow-cyan);
}

.brand-icon {
  font-size: 1.2rem;
  color: #000000;
}

.brand-titles {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
}

.brand-badge {
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

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-mono);
}

.encrypted-pill {
  background: rgba(0, 242, 254, 0.15);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.3);
}

.plaintext-pill {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-switcher {
  display: flex;
  background: var(--bg-glass-input);
  padding: 0.15rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.layout-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 1.875rem;
  height: 1.875rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.layout-btn:hover {
  color: var(--text-primary);
}

.layout-btn.active {
  background: var(--accent-cyan);
  color: #000000;
}

.theme-btn {
  border: 1px solid var(--border-subtle);
  background: var(--bg-glass-input);
}

.theme-btn:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan-glow);
}

.settings-toggle-btn {
  background: rgba(30, 41, 59, 0.8);
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
  background: rgba(4, 7, 13, 0.75);
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
  color: #ffffff;
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
