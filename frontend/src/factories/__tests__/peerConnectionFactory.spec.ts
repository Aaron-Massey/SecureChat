import { describe, it, expect } from 'vitest';
import { PeerConnectionFactory } from '../peerConnectionFactory';
import { ConfigurableIceStrategy } from '@/strategies/iceServerStrategy';

describe('PeerConnectionFactory', () => {
  it('instantiates PeerConnectionFactory with default strategy', () => {
    const factory = new PeerConnectionFactory();
    expect(factory).toBeDefined();
  });

  it('allows setting custom strategy on PeerConnectionFactory', () => {
    const factory = new PeerConnectionFactory();
    const customStrategy = new ConfigurableIceStrategy({
      turnUrl: 'turn:custom.domain:3478',
      turnUsername: 'user',
      turnPassword: 'pass'
    });
    factory.setStrategy(customStrategy);
    expect(factory).toBeDefined();
  });

  it('createWithConfig static helper builds factory with custom config strategy', () => {
    const factory = PeerConnectionFactory.createWithConfig({
      turnUrl: 'turn:chat.aaronmassey.dev:3478',
      turnUsername: 'admin',
      turnPassword: 'secretpassword'
    });
    expect(factory).toBeDefined();
  });
});
