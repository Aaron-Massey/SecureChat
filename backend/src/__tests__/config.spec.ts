import { describe, it, expect } from 'vitest';
import { loadConfig } from '../config.js';

describe('ConfigService', () => {
  it('loads default or configured values', () => {
    const config = loadConfig();
    expect(config.FRONTEND_PORT).toBeGreaterThan(0);
    expect(config.BACKEND_PORT).toBeGreaterThan(0);
    expect(config.CORS_ORIGIN).toBeDefined();
    expect(config.KEY_DERIVATION_ITERATIONS).toBeGreaterThan(0);
    expect(config.KEY_DERIVATION_SALT).toBeDefined();
  });
});
