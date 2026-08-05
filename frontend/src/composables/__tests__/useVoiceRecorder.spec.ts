import { describe, it, expect } from 'vitest';
import { formatRecordingTime } from '../useVoiceRecorder';

describe('useVoiceRecorder', () => {
  describe('formatRecordingTime', () => {
    it('formats seconds into MM:SS format', () => {
      expect(formatRecordingTime(0)).toBe('00:00');
      expect(formatRecordingTime(5)).toBe('00:05');
      expect(formatRecordingTime(59)).toBe('00:59');
      expect(formatRecordingTime(60)).toBe('01:00');
      expect(formatRecordingTime(125)).toBe('02:05');
    });
  });
});
