'use client';

import { WS_BASE_URL } from '@/lib/configs';

export interface BackendTelemetry {
  id: string;
  deviceId: string;
  attribute: string;
  value: string;
  timestamp: string;
}

type MessageCallback = (data: BackendTelemetry) => void;

class TelemetrySocketManager {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<MessageCallback>>();
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;

  constructor(url: string) {
    this.url = url;
  }

  private connect() {
    if (this.listeners.size === 0) {
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.ws = new WebSocket(this.url);
    this.intentionalClose = false;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const incomingData = JSON.parse(event.data);
        const processData = (data: unknown) => {
          const payload = data as Record<string, unknown>;
          if (
            payload &&
            typeof payload === 'object' &&
            typeof payload.deviceId === 'string' &&
            typeof payload.attribute === 'string'
          ) {
            const key = `${payload.deviceId}:${payload.attribute}`;
            const callbacks = this.listeners.get(key);
            if (callbacks) {
              callbacks.forEach((cb) => cb(payload as unknown as BackendTelemetry));
            }
          }
        };

        if (Array.isArray(incomingData)) {
          incomingData.forEach(processData);
        } else {
          processData(incomingData);
        }
      } catch (err) {
        console.error('WebSocket 訊息解析失敗:', err);
      }
    };

    this.ws.onclose = (event) => {
      this.ws = null;

      if (this.intentionalClose) {
        return;
      }

      console.warn(`WebSocket 連線中斷 (Code: ${event.code})。`);

      if (!this.reconnectTimeout) {
        const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempts), 30000);

        this.reconnectTimeout = window.setTimeout(() => {
          this.reconnectTimeout = null;
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket 發生錯誤:', err);
    };
  }

  subscribe(deviceId: string, attribute: string, callback: MessageCallback) {
    const key = `${deviceId}:${attribute}`;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    this.connect();

    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }

      if (this.listeners.size === 0) {
        this.intentionalClose = true;

        if (this.ws) {
          this.ws.close();
        }

        if (this.reconnectTimeout) {
          window.clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }
    };
  }
}

export const telemetrySocket = new TelemetrySocketManager(WS_BASE_URL);
