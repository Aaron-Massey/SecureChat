import { describe, it, expect } from 'vitest';
import { ConfigurableIceStrategy, DefaultIceStrategy, IceStrategyResolver } from '../iceServerStrategy';

describe('IceServerStrategy (GOF Strategy Pattern)', () => {
  it('DefaultIceStrategy returns fallback public STUN/TURN servers', () => {
    const strategy = new DefaultIceStrategy();
    const servers = strategy.getIceServers();
    expect(servers.length).toBeGreaterThan(0);
    expect(servers.some((s) => typeof s.urls === 'string' && s.urls.includes('stun.l.google.com'))).toBe(true);
  });

  it('ConfigurableIceStrategy injects custom TURN credentials at the beginning', () => {
    const customConfig = {
      turnUrl: 'turn:chat.aaronmassey.dev:3478',
      turnUsername: 'securechat',
      turnPassword: 'password123'
    };
    const strategy = new ConfigurableIceStrategy(customConfig);
    const servers = strategy.getIceServers();

    expect(servers[0]!.username).toBe('securechat');
    expect(servers[0]!.credential).toBe('password123');
    expect(servers.some((s) => typeof s.urls === 'string' && s.urls.includes('transport=tcp'))).toBe(true);
  });

  it('IceStrategyResolver resolves ConfigurableIceStrategy when custom TURN config is provided', () => {
    const resolved = IceStrategyResolver.resolve({
      turnUrl: 'turn:chat.aaronmassey.dev:3478',
      turnUsername: 'user',
      turnPassword: 'pass'
    });
    expect(resolved).toBeInstanceOf(ConfigurableIceStrategy);
  });

  it('IceStrategyResolver resolves DefaultIceStrategy when no custom config is provided', () => {
    const resolved = IceStrategyResolver.resolve();
    expect(resolved).toBeInstanceOf(DefaultIceStrategy);
  });
});
