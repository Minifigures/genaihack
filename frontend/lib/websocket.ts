const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface WSMessage {
  event: string;
  agent: string;
  message: string;
  duration_ms: number | null;
}

export type WSCallback = (message: WSMessage) => void;

export class TraceWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: WSCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    try {
      this.ws = new WebSocket(`${WS_URL}/ws/trace`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          this.callbacks.forEach((cb) => cb(data));
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };
    } catch {
      // Connection failed
    }
  }

  onMessage(callback: WSCallback): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: WSCallback): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks = [];
  }
}
