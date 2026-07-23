<template>
  <div class="media-attachment-card">
    <!-- Active File Transfer Progress -->
    <div v-if="isTransferring" class="transfer-progress">
      <div class="transfer-header">
        <i class="pi pi-download transfer-icon"></i>
        <span class="file-name" :title="fileName">{{ fileName }}</span>
        <span class="file-size">({{ formattedSize }})</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <span class="progress-percentage">Receiving {{ progress }}%</span>
    </div>

    <!-- Completed Transfer Display -->
    <template v-else>
      <!-- Image / Video Click-to-View Media -->
      <div v-if="isMedia" class="media-preview-wrapper">
        <!-- Unrevealed State (Click to View Overlay) -->
        <div v-if="!isRevealed" class="media-overlay">
          <div class="media-meta">
            <span class="media-type-badge">{{ isImage ? 'IMAGE' : 'VIDEO' }}</span>
            <span class="media-file-name">{{ fileName }}</span>
            <span class="media-file-size">({{ formattedSize }})</span>
          </div>
          <button @click="toggleReveal" class="reveal-button">
            <i class="pi pi-eye"></i> Preview {{ isImage ? 'Image' : 'Video' }}
          </button>
        </div>

        <!-- Revealed State -->
        <div v-else class="revealed-media-container">
          <div class="media-toolbar">
            <span class="media-file-name">{{ fileName }}</span>
            <div class="toolbar-actions">
              <a :href="mediaUrl" :download="fileName" class="download-link" title="Download File">
                <i class="pi pi-download"></i> Save
              </a>
              <button @click="toggleReveal" class="hide-button" title="Hide Media">
                <i class="pi pi-eye-slash"></i> Hide
              </button>
            </div>
          </div>

          <div class="media-content">
            <div v-if="hasLoadError" class="media-error-box">
              ⚠️ Unable to render media preview. You can still download the file below.
            </div>
            <img v-else-if="isImage" :src="mediaUrl" :alt="fileName" class="embedded-image" @error="onMediaError" />
            <video v-else-if="isVideo" :src="mediaUrl" controls preload="metadata" class="embedded-video" @error="onMediaError"></video>
          </div>
        </div>
      </div>

      <!-- Generic Non-Media File Download Card -->
      <div v-else class="generic-file-card">
        <div class="file-details">
          <i class="pi pi-file file-type-icon"></i>
          <div class="file-info">
            <span class="file-title" :title="fileName">{{ fileName }}</span>
            <span class="file-meta">{{ formattedSize }} • {{ mimeType || 'Unknown format' }}</span>
          </div>
        </div>
        <a :href="mediaUrl" :download="fileName" class="download-button">
          <i class="pi pi-download"></i> Download
        </a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { formatFileSize, revokeObjectUrl } from '@/utils/fileChunker';

const props = withDefaults(
  defineProps<{
    fileName: string;
    fileSize: number;
    mimeType: string;
    mediaUrl: string;
    progress?: number;
    isTransferring?: boolean;
  }>(),
  {
    progress: 100,
    isTransferring: false
  }
);

const isRevealed = ref(false);
const hasLoadError = ref(false);

const isImage = computed(() => props.mimeType.startsWith('image/'));
const isVideo = computed(() => props.mimeType.startsWith('video/'));
const isMedia = computed(() => isImage.value || isVideo.value);
const formattedSize = computed(() => formatFileSize(props.fileSize));

const toggleReveal = () => {
  isRevealed.value = !isRevealed.value;
};

const onMediaError = () => {
  hasLoadError.value = true;
};

onUnmounted(() => {
  if (props.mediaUrl) {
    revokeObjectUrl(props.mediaUrl);
  }
});
</script>

<style scoped>
.media-attachment-card {
  margin-top: 0.5rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.75rem;
  max-width: 100%;
  box-sizing: border-box;
  backdrop-filter: var(--glass-backdrop-filter);
}

.transfer-progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.transfer-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-icon {
  color: var(--accent-cyan);
}

.progress-bar-track {
  height: 0.375rem;
  background-color: var(--bg-dark-panel);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald));
  transition: width 0.2s ease-in-out;
  box-shadow: 0 0 8px var(--accent-cyan-glow);
}

.progress-percentage {
  font-size: 0.75rem;
  color: var(--text-muted);
  align-self: flex-end;
}

.media-preview-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.media-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  gap: 0.625rem;
}

.media-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.media-type-badge {
  background: rgba(0, 242, 254, 0.15);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.3);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
  font-size: 0.7rem;
  font-weight: 600;
}

.reveal-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(16, 185, 129, 0.2));
  color: var(--text-primary);
  border: 1px solid var(--accent-cyan);
  padding: 0.4rem 0.875rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.reveal-button:hover {
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.4), rgba(16, 185, 129, 0.4));
  box-shadow: var(--shadow-glow-cyan);
}

.revealed-media-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.media-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.download-link {
  color: var(--accent-cyan);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.download-link:hover {
  text-decoration: underline;
}

.hide-button {
  background: transparent;
  border: none;
  color: var(--accent-rose);
  cursor: pointer;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.embedded-image,
.embedded-video {
  max-width: 100%;
  max-height: 20rem;
  border-radius: var(--radius-md);
  display: block;
}

.generic-file-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  overflow: hidden;
}

.file-type-icon {
  font-size: 1.25rem;
  color: var(--accent-cyan);
}

.file-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-title {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.download-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(0, 242, 254, 0.1);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.3);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: var(--transition-fast);
}

.download-button:hover {
  background: var(--accent-cyan);
  color: var(--bg-dark-root);
  box-shadow: var(--shadow-glow-cyan);
}

.media-error-box {
  background: rgba(244, 63, 94, 0.15);
  color: #fda4af;
  border: 1px solid rgba(244, 63, 94, 0.3);
  border-radius: var(--radius-md);
  padding: 0.625rem;
  font-size: 0.85rem;
}
</style>
