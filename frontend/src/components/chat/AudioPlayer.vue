<template>
  <div class="custom-audio-player" role="region" :aria-label="`Audio player for ${fileName}`">
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      aria-hidden="true"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @error="onError"
    ></audio>

    <div v-if="hasError" class="audio-error-msg" role="alert" aria-live="assertive">
      ⚠️ Failed to load audio stream.
    </div>

    <div v-else class="audio-controls-container">
      <!-- Solid Play/Pause Button (No Gradient) -->
      <button
        @click="togglePlay"
        class="play-pause-btn"
        :class="{ 'is-playing': isPlaying }"
        :aria-label="isPlaying ? 'Pause audio' : 'Play audio'"
        :aria-pressed="isPlaying"
      >
        <Pause v-if="isPlaying" :size="18" aria-hidden="true" />
        <Play v-else :size="18" class="play-icon-offset" aria-hidden="true" />
      </button>

      <!-- Main Audio Waveform & Scrubber Section -->
      <div class="audio-body">
        <div class="audio-info-row">
          <span class="audio-title" :title="fileName">{{ fileName }}</span>
          <span class="audio-time-display">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </span>
        </div>

        <!-- Interactive Progress Scrubber -->
        <div class="scrubber-wrapper">
          <input
            type="range"
            min="0"
            :max="duration || 100"
            step="0.1"
            :value="currentTime"
            @input="onSeek"
            class="audio-scrubber"
            :style="{ '--progress-percent': `${progressPercent}%` }"
            :aria-label="`Seek audio position: ${formatTime(currentTime)}`"
            :aria-valuenow="Math.round(currentTime)"
            aria-valuemin="0"
            :aria-valuemax="Math.round(duration || 100)"
            :aria-valuetext="`${formatTime(currentTime)} of ${formatTime(duration)}`"
          />
        </div>

        <!-- Real-Time Web Audio API Frequency Spectrum Visualizer -->
        <div class="waveform-bars" :class="{ 'is-active': isPlaying }" aria-hidden="true">
          <span
            v-for="(height, index) in barHeights"
            :key="index"
            class="wave-bar"
            :style="{ height: `${height}px` }"
          ></span>
        </div>
      </div>

      <!-- Volume Button & Interactive Volume Slider -->
      <div class="volume-control-wrapper">
        <button
          @click="toggleMute"
          class="volume-btn"
          :title="isMuted ? 'Unmute' : 'Mute'"
          :aria-label="isMuted ? 'Unmute audio' : 'Mute audio'"
          :aria-pressed="isMuted"
        >
          <VolumeX v-if="isMuted || volume === 0" :size="16" aria-hidden="true" />
          <Volume2 v-else :size="16" aria-hidden="true" />
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="isMuted ? 0 : volume"
          @input="onVolumeChange"
          class="volume-slider"
          :style="{ '--volume-percent': `${(isMuted ? 0 : volume) * 100}%` }"
          :aria-label="`Audio volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`"
          :aria-valuenow="Math.round((isMuted ? 0 : volume) * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuetext="`${Math.round((isMuted ? 0 : volume) * 100)} percent`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { Play, Pause, Volume2, VolumeX } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    src: string;
    fileName?: string;
  }>(),
  {
    fileName: 'Audio Attachment'
  }
);

const emit = defineEmits<{
  (e: 'error'): void;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const previousVolume = ref(1);
const hasError = ref(false);

// Real-Time Web Audio API Frequency Data State (20 bars)
const barHeights = ref<number[]>(new Array(20).fill(3));

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let animFrameId: number | null = null;

const progressPercent = computed(() => {
  if (!duration.value) return 0;
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100));
});

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const initWebAudio = () => {
  if (!audioRef.value || sourceNode) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Produces 32 frequency bins

    sourceNode = audioCtx.createMediaElementSource(audioRef.value);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch {
    // If Web Audio API cannot bind (e.g. cross-origin restriction), fallback gracefully
  }
};

const updateFrequencyVisualizer = () => {
  if (!analyser || !isPlaying.value) {
    barHeights.value = new Array(20).fill(3);
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    return;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const newHeights: number[] = [];
  const step = Math.floor(bufferLength / 20) || 1;
  for (let i = 0; i < 20; i++) {
    const val = dataArray[i * step] || 0;
    // Map frequency value (0-255) to real height range (3px to 14px)
    const height = Math.max(3, Math.min(14, 3 + (val / 255) * 11));
    newHeights.push(height);
  }
  barHeights.value = newHeights;

  animFrameId = requestAnimationFrame(updateFrequencyVisualizer);
};

const togglePlay = () => {
  if (!audioRef.value) return;

  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
    barHeights.value = new Array(20).fill(3);
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  } else {
    initWebAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
        updateFrequencyVisualizer();
      })
      .catch(() => {
        hasError.value = true;
        emit('error');
      });
  }
};

const toggleMute = () => {
  if (!audioRef.value) return;
  if (isMuted.value) {
    isMuted.value = false;
    volume.value = previousVolume.value > 0 ? previousVolume.value : 1;
    audioRef.value.volume = volume.value;
    audioRef.value.muted = false;
  } else {
    previousVolume.value = volume.value;
    isMuted.value = true;
    audioRef.value.muted = true;
  }
};

const onVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newVol = parseFloat(target.value);
  volume.value = newVol;
  if (newVol > 0) {
    isMuted.value = false;
  } else {
    isMuted.value = true;
  }
  if (audioRef.value) {
    audioRef.value.volume = newVol;
    audioRef.value.muted = isMuted.value;
  }
};

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
};

const onSeek = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newTime = parseFloat(target.value);
  currentTime.value = newTime;
  if (audioRef.value) {
    audioRef.value.currentTime = newTime;
  }
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  barHeights.value = new Array(20).fill(3);
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (audioRef.value) {
    audioRef.value.currentTime = 0;
  }
};

const onError = () => {
  hasError.value = true;
  isPlaying.value = false;
  emit('error');
};

onBeforeUnmount(() => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
  }
  if (audioRef.value) {
    audioRef.value.pause();
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
  }
});
</script>

<style scoped>
.custom-audio-player {
  width: 100%;
  max-width: 28rem;
  background: var(--bg-glass-panel, rgba(15, 23, 42, 0.75));
  border: 1px solid var(--border-subtle, rgba(56, 189, 248, 0.2));
  border-radius: var(--radius-lg, 0.75rem);
  padding: 0.75rem 0.875rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
}

.audio-controls-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Solid Play/Pause Button (No Gradient) */
.play-pause-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--accent-cyan, #06b6d4);
  color: #0f172a;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.play-pause-btn:hover {
  background: var(--accent-cyan-hover, #22d3ee);
  transform: scale(1.06);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.6);
}

.play-icon-offset {
  margin-left: 2px;
}

.audio-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.audio-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.audio-title {
  color: var(--text-primary, #f8fafc);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 10rem;
}

.audio-time-display {
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
  font-size: 0.7rem;
}

.scrubber-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.audio-scrubber {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--accent-cyan, #06b6d4) 0%,
    var(--accent-cyan, #06b6d4) var(--progress-percent, 0%),
    rgba(255, 255, 255, 0.15) var(--progress-percent, 0%),
    rgba(255, 255, 255, 0.15) 100%
  );
  outline: none;
  cursor: pointer;
}

.audio-scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 8px var(--accent-cyan, #06b6d4);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.audio-scrubber::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.waveform-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 14px;
  margin-top: 2px;
}

.wave-bar {
  flex: 1;
  height: 3px;
  background: var(--accent-cyan, #06b6d4);
  opacity: 0.4;
  border-radius: 1px;
  transition: height 0.08s ease, opacity 0.2s ease;
}

.waveform-bars.is-active .wave-bar {
  opacity: 0.9;
}

/* Volume Control Wrapper & Slider */
.volume-control-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.volume-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.volume-btn:hover {
  color: var(--accent-cyan, #06b6d4);
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 3.5rem;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--accent-cyan, #06b6d4) 0%,
    var(--accent-cyan, #06b6d4) var(--volume-percent, 100%),
    rgba(255, 255, 255, 0.15) var(--volume-percent, 100%),
    rgba(255, 255, 255, 0.15) 100%
  );
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.audio-error-msg {
  color: var(--alert-danger-text, #f87171);
  font-size: 0.8rem;
}
</style>
