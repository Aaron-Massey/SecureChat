export interface IceServerConfig {
  turnUrl?: string;
  turnUsername?: string;
  turnPassword?: string;
}

/**
 * Strategy Pattern: IceServerStrategy
 */
export interface IceServerStrategy {
  getIceServers(): RTCIceServer[];
}

/**
 * Strategy for user-configured or self-hosted TURN / STUN server
 */
export class ConfigurableIceStrategy implements IceServerStrategy {
  private config: IceServerConfig;

  constructor(config: IceServerConfig) {
    this.config = config;
  }

  getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ];

    if (this.config.turnUrl && this.config.turnUsername && this.config.turnPassword) {
      servers.unshift({
        urls: this.config.turnUrl,
        username: this.config.turnUsername,
        credential: this.config.turnPassword
      });

      // Also add TCP transport variant if port 443/3478 is used
      if (!this.config.turnUrl.includes('transport=')) {
        const tcpUrl = this.config.turnUrl.includes('?') 
          ? `${this.config.turnUrl}&transport=tcp` 
          : `${this.config.turnUrl}?transport=tcp`;
        servers.unshift({
          urls: tcpUrl,
          username: this.config.turnUsername,
          credential: this.config.turnPassword
        });
      }
    }

    return servers;
  }
}

/**
 * Default fallback strategy utilizing public STUN and demo TURN servers
 */
export class DefaultIceStrategy implements IceServerStrategy {
  getIceServers(): RTCIceServer[] {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:openrelay.metered.ca:80' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
  }
}

export class IceStrategyResolver {
  public static resolve(config?: IceServerConfig): IceServerStrategy {
    if (config?.turnUrl && config?.turnUsername && config?.turnPassword) {
      console.log(`[ICE STRATEGY] Using ConfigurableIceStrategy with custom TURN URL: ${config.turnUrl} (user: ${config.turnUsername})`);
      return new ConfigurableIceStrategy(config);
    }
    console.log('[ICE STRATEGY] Using DefaultIceStrategy with public STUN/TURN fallback servers');
    return new DefaultIceStrategy();
  }
}
