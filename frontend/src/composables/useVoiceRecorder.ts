import { ref, onUnmounted } from 'vue';

function getSupportedMimeType(): { mimeType: string; extension: string } {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: '', extension: 'webm' };
  }
  const types = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/mp4', extension: 'm4a' },
  ];
  for (const item of types) {
    if (MediaRecorder.isTypeSupported(item.mimeType)) {
      return item;
    }
  }
  return { mimeType: '', extension: 'webm' };
}

export function formatRecordingTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function useVoiceRecorder() {
  const isRecording = ref(false);
  const durationSeconds = ref(0);
  const recordedDuration = ref(0);
  const recorderError = ref<string | null>(null);
  const recordedFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioStream: MediaStream | null = null;
  let audioChunks: Blob[] = [];
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const stopStream = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
  };

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const clearPreview = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
    recordedFile.value = null;
    recordedDuration.value = 0;
  };

  const startRecording = async (): Promise<boolean> => {
    recorderError.value = null;
    clearPreview();

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      recorderError.value = 'Microphone recording is not supported in this browser environment.';
      return false;
    }

    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'SecurityError') {
        recorderError.value = 'Microphone access was denied. If embedded in an iframe, ensure allow="microphone" is set.';
      } else {
        recorderError.value = `Unable to access microphone: ${errorObj.message || 'Permission error'}`;
      }
      return false;
    }

    const { mimeType } = getSupportedMimeType();
    audioChunks = [];
    durationSeconds.value = 0;

    try {
      mediaRecorder = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
    } catch {
      mediaRecorder = new MediaRecorder(audioStream);
    }

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100);
    isRecording.value = true;

    timerInterval = setInterval(() => {
      durationSeconds.value++;
    }, 1000);

    return true;
  };

  const stopRecording = (): Promise<File | null> => {
    return new Promise(resolve => {
      if (!mediaRecorder || !isRecording.value) {
        cancelRecording();
        resolve(null);
        return;
      }

      recordedDuration.value = durationSeconds.value;
      clearTimer();

      mediaRecorder.onstop = () => {
        const { mimeType, extension } = getSupportedMimeType();
        const blobType = mimeType || audioChunks[0]?.type || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: blobType });
        
        stopStream();
        isRecording.value = false;
        mediaRecorder = null;

        if (audioBlob.size === 0) {
          resolve(null);
          return;
        }

        const fileName = `voice_note_${Date.now()}.${extension}`;
        const voiceFile = new File([audioBlob], fileName, { type: blobType });
        
        recordedFile.value = voiceFile;
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          previewUrl.value = URL.createObjectURL(voiceFile);
        }

        resolve(voiceFile);
      };

      try {
        mediaRecorder.stop();
      } catch {
        stopStream();
        isRecording.value = false;
        mediaRecorder = null;
        resolve(null);
      }
    });
  };

  const cancelRecording = () => {
    clearTimer();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {
        // Ignore stop errors on cancellation
      }
    }
    stopStream();
    audioChunks = [];
    isRecording.value = false;
    durationSeconds.value = 0;
    mediaRecorder = null;
    clearPreview();
  };

  onUnmounted(() => {
    cancelRecording();
  });

  return {
    isRecording,
    durationSeconds,
    recordedDuration,
    recorderError,
    recordedFile,
    previewUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    clearPreview,
  };
}
