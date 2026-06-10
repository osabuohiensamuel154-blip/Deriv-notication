import { derivApi, TickData } from './derivApi';
import { storageService } from './storage';
import { notificationService } from './notifications';

class AlertMonitorService {
  private unsubscribers = new Map<string, () => void>();
  private latestPrices = new Map<string, number>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  async start(): Promise<void> {
    if (this.started) {
      await this.refresh();
      return;
    }
    this.started = true;
    derivApi.connect();
    await this.refresh();
    // Re-sync subscriptions every 15s to pick up newly saved alerts
    this.refreshTimer = setInterval(() => this.refresh(), 15000);
  }

  /** Call this after saving a new alert so monitoring starts immediately */
  async refresh(): Promise<void> {
    const alerts = await storageService.getAlerts();
    const activeSymbols = [
      ...new Set(
        alerts.filter((a) => a.active && !a.triggered).map((a) => a.symbol)
      ),
    ];

    // Drop subscriptions for symbols no longer needed
    for (const [sym, unsub] of this.unsubscribers) {
      if (!activeSymbols.includes(sym)) {
        unsub();
        this.unsubscribers.delete(sym);
      }
    }

    // Add subscriptions for new symbols
    for (const sym of activeSymbols) {
      if (!this.unsubscribers.has(sym)) {
        const unsub = derivApi.subscribe(sym, (tick: TickData) => {
          this.latestPrices.set(sym, tick.price);
          this.checkAlerts(sym, tick.price);
        });
        this.unsubscribers.set(sym, unsub);
      }
    }
  }

  getLatestPrice(symbol: string): number | undefined {
    return this.latestPrices.get(symbol);
  }

  private async checkAlerts(symbol: string, price: number): Promise<void> {
    const alerts = await storageService.getAlerts();
    for (const alert of alerts) {
      if (alert.symbol !== symbol || !alert.active || alert.triggered) continue;

      const hit =
        (alert.condition === 'above' && price >= alert.targetPrice) ||
        (alert.condition === 'below' && price <= alert.targetPrice);

      if (hit) {
        await storageService.markAlertTriggered(alert.id);
        await notificationService.sendPriceAlert(
          alert.instrumentName,
          alert.condition,
          alert.targetPrice,
          price
        );
        // Re-sync so the triggered alert is no longer subscribed
        this.refresh();
      }
    }
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    for (const unsub of this.unsubscribers.values()) unsub();
    this.unsubscribers.clear();
    this.started = false;
  }
}

export const alertMonitor = new AlertMonitorService();
