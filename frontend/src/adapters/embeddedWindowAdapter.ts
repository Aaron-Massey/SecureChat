/**
 * GOF Adapter Pattern: Embedded Window Adapter
 * Adapts host window messages (postMessage) and container signals between parent portfolio desktop windows
 * and the SecureChat application state.
 */

export interface HostMessage {
  type: string;
  payload?: any;
}

export interface AppStatusPayload {
  connectionStatus: string;
  isEncrypted: boolean;
  unreadCount: number;
  unreadDebugCount: number;
}

export class EmbeddedWindowAdapter {
  private isEmbedded: boolean;
  private onMessageCallbacks: Array<(msg: HostMessage) => void> = [];

  constructor() {
    this.isEmbedded = window.self !== window.top || window.opener !== null;
    this.initListener();
  }

  public checkIsEmbedded(): boolean {
    return this.isEmbedded;
  }

  private initListener() {
    window.addEventListener('message', (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, payload } = event.data;
      if (type && type.startsWith('SECURECHAT_')) {
        this.notifyCallbacks({ type, payload });
      }
    });
  }

  public subscribe(callback: (msg: HostMessage) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks(msg: HostMessage) {
    this.onMessageCallbacks.forEach(cb => cb(msg));
  }

  public emitToHost(type: string, payload?: any) {
    const message = { type: `SECURECHAT_EVENT_${type}`, payload, timestamp: Date.now() };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
    if (window.opener) {
      window.opener.postMessage(message, '*');
    }
  }

  public emitStatusUpdate(status: AppStatusPayload) {
    this.emitToHost('STATUS_UPDATE', status);
  }
}
