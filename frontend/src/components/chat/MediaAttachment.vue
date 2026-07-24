<template>
  <div class="media-attachment-card">
    <!-- Active File Transfer Progress -->
    <div v-if="isTransferring" class="transfer-progress">
      <div class="transfer-header">
        <span class="file-icon">📥</span>
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
            👁️ Click to View {{ isImage ? 'Image' : 'Video' }}
          </button>
        </div>

        <!-- Revealed State -->
        <div v-else class="revealed-media-container">
          <div class="media-toolbar">
            <span class="media-file-name">{{ fileName }}</span>
            <div class="toolbar-actions">
              <a :href="mediaUrl" :download="fileName" class="download-link" title="Download File">💾 Download</a>
              <button @click="toggleReveal" class="hide-button" title="Hide Media">🙈 Hide</button>
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
          <span class="file-type-icon">📄</span>
          <div class="file-info">
            <span class="file-title" :title="fileName">{{ fileName }}</span>
            <span class="file-meta">{{ formattedSize }} • {{ mimeType || 'Unknown format' }}</span>
          </div>
        </div>
        <a :href="mediaUrl" :download="fileName" class="download-button">
          ⬇️ Download
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
  background-color: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  padding: 0.625rem;
  max-width: 100%;
  box-sizing: border-box;
}

.transfer-progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: #ccc;
}

.transfer-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-bar-track {
  height: 0.375rem;
  background-color: #444;
  border-radius: 0.2rem;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #00ff00;
  transition: width 0.2s ease-in-out;
}

.progress-percentage {
  font-size: 0.75rem;
  color: #888;
  align-self: flex-end;
}

.media-preview-wrapper {
  border-radius: 0.375rem;
  overflow: hidden;
}

.media-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0.625rem;
  background-color: #1f1f1f;
  border: 1px dashed #444;
  border-radius: 0.375rem;
  gap: 0.625rem;
}

.media-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #aaa;
}

.media-type-badge {
  background-color: #333;
  color: #00ff00;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: bold;
}

.reveal-button {
  background-color: #00ff00;
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reveal-button:hover {
  background-color: #00cc00;
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
  color: #aaa;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #333;
}

.toolbar-actions {
  display: flex;
  gap: 0.625rem;
  align-items: center;
}

.download-link {
  color: #00ff00;
  text-decoration: none;
}

.download-link:hover {
  text-decoration: underline;
}

.hide-button {
  background: transparent;
  border: none;
  color: #ff5555;
  cursor: pointer;
  font-size: 0.8rem;
}

.embedded-image,
.embedded-video {
  max-width: 100%;
  max-height: 22rem;
  border-radius: 0.25rem;
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
  font-size: 1.5rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-title {
  font-weight: bold;
  color: #fff;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.75rem;
  color: #888;
}

.download-button {
  background-color: #333;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.download-button:hover {
  background-color: #00ff00;
  color: #000;
}

.media-error-box {
  background-color: #3a2222;
  color: #ffaaaa;
  border: 1px solid #773333;
  border-radius: 0.25rem;
  padding: 0.625rem;
  font-size: 0.85rem;
}
</style>
