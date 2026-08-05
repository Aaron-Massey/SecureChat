<template>
  <div class="media-attachment-card" role="region" aria-label="Media Attachment">
    <div v-if="isTransferring" class="transfer-progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Receiving ${fileName}: ${progress}%`">
      <div class="transfer-header">
        <Download class="transfer-icon" :size="16" aria-hidden="true" />
        <span class="file-name" :title="fileName">{{ fileName }}</span>
        <span class="file-size">({{ formattedSize }})</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <span class="progress-percentage">Receiving {{ progress }}%</span>
    </div>

    <template v-else>
      <div v-if="isMedia" class="media-preview-wrapper">
        <div v-if="!isRevealed" class="media-overlay">
          <div class="media-meta">
            <span class="media-type-badge">{{ isImage ? 'IMAGE' : 'VIDEO' }}</span>
            <span class="media-file-name">{{ fileName }}</span>
            <span class="media-file-size">({{ formattedSize }})</span>
          </div>
          <button @click="toggleReveal" class="reveal-button" :aria-label="`Preview ${isImage ? 'image' : 'video'} ${fileName}`">
            <Eye :size="14" aria-hidden="true" /> Preview {{ isImage ? 'Image' : 'Video' }}
          </button>
        </div>

        <div v-else class="revealed-media-container">
          <div class="media-toolbar">
            <span class="media-file-name">{{ fileName }}</span>
            <div class="toolbar-actions">
              <a :href="mediaUrl" :download="fileName" class="download-link" title="Download File" :aria-label="`Save file ${fileName}`">
                <Download :size="14" aria-hidden="true" /> Save
              </a>
              <button @click="toggleReveal" class="hide-button" title="Hide Media" :aria-label="`Hide preview ${fileName}`">
                <EyeOff :size="14" aria-hidden="true" /> Hide
              </button>
            </div>
          </div>

          <div class="media-content">
            <div v-if="hasLoadError" class="media-error-box" role="alert">
              ⚠️ Unable to render media preview. You can still download the file below.
            </div>
            <img v-else-if="isImage" :src="mediaUrl" :alt="fileName" class="embedded-image" @error="onMediaError" />
            <video v-else-if="isVideo" :src="mediaUrl" controls preload="metadata" class="embedded-video" :aria-label="`Video attachment ${fileName}`" @error="onMediaError"></video>
          </div>
        </div>
      </div>

      <div v-else class="generic-file-card">
        <div class="file-details">
          <FileText class="file-type-icon" :size="20" aria-hidden="true" />
          <div class="file-info">
            <span class="file-title" :title="fileName">{{ fileName }}</span>
            <span class="file-meta">{{ formattedSize }} • {{ mimeType || 'Unknown format' }}</span>
          </div>
        </div>
        <a :href="mediaUrl" :download="fileName" class="download-button" :aria-label="`Download file ${fileName}`">
          <Download :size="14" aria-hidden="true" /> Download
        </a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { Download, Eye, EyeOff, FileText } from '@lucide/vue';
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
  background: var(--bg-dark-panel);
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
  background: var(--bg-glass-input);
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
  background: var(--pill-encrypted-bg);
  color: var(--pill-encrypted-text);
  border: 1px solid var(--pill-encrypted-border);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
  font-size: 0.7rem;
  font-weight: 600;
}

.reveal-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--btn-secondary-bg);
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
  background: var(--btn-secondary-hover-bg);
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
  background: var(--pill-encrypted-bg);
  color: var(--accent-cyan);
  border: 1px solid var(--pill-encrypted-border);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: var(--transition-fast);
}

.download-button:hover {
  background: var(--accent-cyan);
  color: var(--text-inverse);
  box-shadow: var(--shadow-glow-cyan);
}

.media-error-box {
  background: var(--alert-danger-bg);
  color: var(--alert-danger-text);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-md);
  padding: 0.625rem;
  font-size: 0.85rem;
}
</style>
