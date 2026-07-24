/**
 * Sliding Window Message Rate Limiter
 * Prevents message spamming and flooding peer connections.
 */
export class MessageRateLimiter {
  private timestamps: number[] = [];
  private maxMessages: number;
  private windowMs: number;

  constructor(maxMessages: number = 30, windowMs: number = 60000) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
  }

  /**
   * Checks whether a message attempt is allowed under current rate limits.
   * If allowed, records the timestamp and returns true; otherwise returns false.
   */
  public isAllowed(now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    this.timestamps = this.timestamps.filter(ts => ts > cutoff);

    if (this.timestamps.length >= this.maxMessages) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  public reset(): void {
    this.timestamps = [];
  }

  /**
   * Returns the exact discrete count of active messages in the current rolling window.
   */
  public get count(): number {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter(ts => ts > cutoff);
    return this.timestamps.length;
  }

  public get limit(): number {
    return this.maxMessages;
  }

  public get windowDurationMs(): number {
    return this.windowMs;
  }
}
