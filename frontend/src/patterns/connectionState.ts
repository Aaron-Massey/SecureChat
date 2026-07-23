import type { ConnectionStatus } from '@/services/p2pManager';

/**
 * State Pattern: P2PConnectionState
 * Encapsulates state-specific logic for P2P Connection Status.
 */
export abstract class P2PConnectionState {
  abstract readonly status: ConnectionStatus;
  abstract readonly isConnected: boolean;
  abstract readonly canSend: boolean;
  abstract getStatusDetail(detail?: string): string;
}

export class ConnectedState extends P2PConnectionState {
  readonly status: ConnectionStatus = 'connected';
  readonly isConnected = true;
  readonly canSend = true;

  getStatusDetail(detail?: string): string {
    return detail || 'Connected to signaling server and peers.';
  }
}

export class ReconnectingState extends P2PConnectionState {
  readonly status: ConnectionStatus = 'reconnecting';
  readonly isConnected = false;
  readonly canSend = false;

  getStatusDetail(detail?: string): string {
    return detail || 'Connection lost. Attempting to reconnect...';
  }
}

export class DisconnectedState extends P2PConnectionState {
  readonly status: ConnectionStatus = 'disconnected';
  readonly isConnected = false;
  readonly canSend = false;

  getStatusDetail(detail?: string): string {
    return detail || 'Disconnected from signaling server.';
  }
}

export class ConnectionStateContext {
  private currentState: P2PConnectionState = new DisconnectedState();

  public setState(status: ConnectionStatus): P2PConnectionState {
    switch (status) {
      case 'connected':
        this.currentState = new ConnectedState();
        break;
      case 'reconnecting':
        this.currentState = new ReconnectingState();
        break;
      case 'disconnected':
      default:
        this.currentState = new DisconnectedState();
        break;
    }
    return this.currentState;
  }

  public get state(): P2PConnectionState {
    return this.currentState;
  }
}
