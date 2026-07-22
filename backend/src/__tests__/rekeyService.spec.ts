import { describe, it, expect } from 'vitest';
import { RekeyService } from '../services/rekeyService.js';

describe('RekeyService', () => {
  it('instantiates and manages timer status', () => {
    const service = new RekeyService({ minMinutes: 1, maxMinutes: 2 });
    expect(service.isRunning()).toBe(false);
    service.stop();
    expect(service.isRunning()).toBe(false);
  });
});
