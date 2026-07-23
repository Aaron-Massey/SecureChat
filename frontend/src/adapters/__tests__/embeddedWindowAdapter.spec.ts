import { describe, it, expect, vi } from 'vitest';
import { EmbeddedWindowAdapter, type HostMessage } from '../embeddedWindowAdapter';

describe('EmbeddedWindowAdapter (GOF Adapter Pattern)', () => {
  it('instantiates EmbeddedWindowAdapter and checks embedded status', () => {
    const adapter = new EmbeddedWindowAdapter();
    expect(typeof adapter.checkIsEmbedded()).toBe('boolean');
  });

  it('subscribes and receives incoming postMessage events', () => {
    const adapter = new EmbeddedWindowAdapter();
    const mockCallback = vi.fn<(msg: HostMessage) => void>();
    const unsubscribe = adapter.subscribe(mockCallback);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'SECURECHAT_SET_TAB', payload: { tab: 'terminal' } },
      })
    );

    expect(mockCallback).toHaveBeenCalledWith({
      type: 'SECURECHAT_SET_TAB',
      payload: { tab: 'terminal' },
    });

    unsubscribe();
  });
});
