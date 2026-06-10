const DERIV_WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';

export interface TickData {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  epoch: number;
}

type TickCallback = (tick: TickData) => void;

class DerivApiService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<TickCallback>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private pendingSubscriptions: Set<string> = new Set();
  private connected = false;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(DERIV_WS_URL);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 2000;
      this.pendingSubscriptions.forEach((symbol) => this.sendTickSubscription(symbol));
      this.pendingSubscriptions.clear();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.msg_type === 'tick' && data.tick) {
          const { tick } = data;
          const tickData: TickData = {
            symbol: tick.symbol,
            bid: tick.bid ?? tick.quote,
            ask: tick.ask ?? tick.quote,
            price: tick.quote,
            epoch: tick.epoch,
          };
          const callbacks = this.subscribers.get(tick.symbol);
          callbacks?.forEach((cb) => cb(tickData));
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Re-queue all active subscriptions
      this.subscribers.forEach((_, symbol) => this.pendingSubscriptions.add(symbol));
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private sendTickSubscription(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
  }

  subscribe(symbol: string, callback: TickCallback): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      if (this.connected) {
        this.sendTickSubscription(symbol);
      } else {
        this.pendingSubscriptions.add(symbol);
        this.connect();
      }
    }
    this.subscribers.get(symbol)!.add(callback);

    return () => this.unsubscribe(symbol, callback);
  }

  private unsubscribe(symbol: string, callback: TickCallback): void {
    const callbacks = this.subscribers.get(symbol);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      this.subscribers.delete(symbol);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
        // Re-subscribe remaining symbols
        this.subscribers.forEach((_, sym) => this.sendTickSubscription(sym));
      }
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }
}

export const derivApi = new DerivApiService();
