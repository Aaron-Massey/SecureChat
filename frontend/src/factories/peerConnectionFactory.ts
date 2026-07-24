import { type IceServerStrategy, IceStrategyResolver, type IceServerConfig } from '@/strategies/iceServerStrategy';

export class PeerConnectionFactory {
  private strategy: IceServerStrategy;

  constructor(strategy?: IceServerStrategy) {
    this.strategy = strategy || IceStrategyResolver.resolve();
  }

  public setStrategy(strategy: IceServerStrategy): void {
    this.strategy = strategy;
  }

  public createPeerConnection(customConfig?: RTCConfiguration): RTCPeerConnection {
    const iceServers = this.strategy.getIceServers();
    const configuration: RTCConfiguration = {
      iceCandidatePoolSize: 10,
      iceServers,
      ...customConfig
    };
    return new RTCPeerConnection(configuration);
  }

  public static createWithConfig(config?: IceServerConfig): PeerConnectionFactory {
    const strategy = IceStrategyResolver.resolve(config);
    return new PeerConnectionFactory(strategy);
  }
}
