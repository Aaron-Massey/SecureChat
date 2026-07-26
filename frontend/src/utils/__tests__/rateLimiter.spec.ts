import { describe, it, expect } from 'vitest';
import { MessageRateLimiter } from '../rateLimiter';

describe('MessageRateLimiter', () => {
  it('allows messages within the rate limit threshold', () => {
    const limiter = new MessageRateLimiter(3, 60000);
    const now = Date.now();

    expect(limiter.isAllowed(now)).toBe(true);
    expect(limiter.isAllowed(now + 100)).toBe(true);
    expect(limiter.isAllowed(now + 200)).toBe(true);
    expect(limiter.isAllowed(now + 300)).toBe(false);
  });

  it('resets window after time elapses', () => {
    const limiter = new MessageRateLimiter(2, 1000);
    const startTime = 10000;

    expect(limiter.isAllowed(startTime)).toBe(true);
    expect(limiter.isAllowed(startTime + 100)).toBe(true);
    expect(limiter.isAllowed(startTime + 200)).toBe(false);

    // After 1000ms window passes
    expect(limiter.isAllowed(startTime + 1100)).toBe(true);
  });

  it('allows manually resetting rate limit timestamps', () => {
    const limiter = new MessageRateLimiter(1, 60000);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);

    limiter.reset();
    expect(limiter.isAllowed()).toBe(true);
  });

  it('tracks count of active messages in the current window', () => {
    const limiter = new MessageRateLimiter(5, 60000);
    expect(limiter.count).toBe(0);

    limiter.isAllowed();
    expect(limiter.count).toBe(1);

    limiter.isAllowed();
    expect(limiter.count).toBe(2);
  });
});
