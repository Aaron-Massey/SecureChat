import type { ConnectionStatus } from '@/services/p2pManager';

/**
 * P2P Connection Status Details & Capabilities
 */
export interface ConnectionStateInfo {
  status: ConnectionStatus;
  isConnected: boolean;
  canSend: boolean;
  defaultDetail: string;
}

const STATE_CONFIG: Record<ConnectionStatus, ConnectionStateInfo> = {
  connected: {
    status: 'connected',
    isConnected: true,
    canSend: true,
    defaultDetail: 'Connected to signaling server and peers.'
  },
  reconnecting: {
    status: 'reconnecting',
    isConnected: false,
    canSend: false,
    defaultDetail: 'Connection lost. Attempting to reconnect...'
  },
  disconnected: {
    status: 'disconnected',
    isConnected: false,
    canSend: false,
    defaultDetail: 'Disconnected from signaling server.'
  }
};

export abstract class P2PConnectionState implements ConnectionStateInfo {
  abstract readonly status: ConnectionStatus;
  abstract readonly isConnected: boolean;
  abstract readonly canSend: boolean;
  abstract readonly defaultDetail: string;

  getStatusDetail(detail?: string): string {
    return detail || this.defaultDetail;
  }
}

export class SimpleP2PState extends P2PConnectionState {
  readonly status: ConnectionStatus;
  readonly isConnected: boolean;
  readonly canSend: boolean;
  readonly defaultDetail: string;

  constructor(info: ConnectionStateInfo) {
    super();
    this.status = info.status;
    this.isConnected = info.isConnected;
    this.canSend = info.canSend;
    this.defaultDetail = info.defaultDetail;
  }
}

export class ConnectedState extends SimpleP2PState {
  constructor() { super(STATE_CONFIG.connected); }
}

export class ReconnectingState extends SimpleP2PState {
  constructor() { super(STATE_CONFIG.reconnecting); }
}

export class DisconnectedState extends SimpleP2PState {
  constructor() { super(STATE_CONFIG.disconnected); }
}

export class ConnectionStateContext {
  private currentState: P2PConnectionState = new DisconnectedState();

  public setState(status: ConnectionStatus): P2PConnectionState {
    const config = STATE_CONFIG[status] || STATE_CONFIG.disconnected;
    this.currentState = new SimpleP2PState(config);
    return this.currentState;
  }

  public get state(): P2PConnectionState {
    return this.currentState;
  }
}
