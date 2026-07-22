import type { SecurePayload } from '@shared/types/payload';
import type { Socket } from 'socket.io-client';

/**
 * Strategy Pattern: ITransportStrategy
 * Abstracts payload delivery strategies (Direct WebRTC DataChannel vs Signaling Relay).
 */
export interface ITransportStrategy {
  readonly name: 'webrtc' | 'relay';
  send(payload: SecurePayload): void;
  sendChunk(payload: SecurePayload): Promise<void>;
}

export class WebRTCTransportStrategy implements ITransportStrategy {
  readonly name = 'webrtc' as const;

  constructor(
    private dataChannels: Map<string, RTCDataChannel>,
    private broadcastChunkWithBackpressure: (payload: SecurePayload) => Promise<void>
  ) {}

  public send(payload: SecurePayload): void {
    const messageString = JSON.stringify(payload);
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(messageString);
      } else {
        console.warn(`Data channel to ${peerId} is not open (state: ${channel.readyState}). Cannot send message.`);
      }
    });
  }

  public async sendChunk(payload: SecurePayload): Promise<void> {
    await this.broadcastChunkWithBackpressure(payload);
  }
}

export class SignalingRelayTransportStrategy implements ITransportStrategy {
  readonly name = 'relay' as const;

  constructor(private socket: Socket) {}

  public send(payload: SecurePayload): void {
    this.socket.emit('relay-message', payload);
  }

  public async sendChunk(payload: SecurePayload): Promise<void> {
    this.socket.emit('relay-message', payload);
  }
}
