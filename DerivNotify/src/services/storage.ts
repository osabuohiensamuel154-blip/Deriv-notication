import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PriceAlert {
  id: string;
  symbol: string;
  instrumentName: string;
  category: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice?: number;
  createdAt: number;
  triggered: boolean;
  active: boolean;
}

const ALERTS_KEY = '@deriv_alerts';
const WATCHED_KEY = '@deriv_watched';

export const storageService = {
  async getAlerts(): Promise<PriceAlert[]> {
    const raw = await AsyncStorage.getItem(ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async saveAlert(alert: PriceAlert): Promise<void> {
    const alerts = await this.getAlerts();
    const idx = alerts.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      alerts[idx] = alert;
    } else {
      alerts.push(alert);
    }
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  },

  async deleteAlert(id: string): Promise<void> {
    const alerts = await this.getAlerts();
    await AsyncStorage.setItem(
      ALERTS_KEY,
      JSON.stringify(alerts.filter((a) => a.id !== id))
    );
  },

  async markAlertTriggered(id: string): Promise<void> {
    const alerts = await this.getAlerts();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.triggered = true;
      alert.active = false;
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }
  },

  async getWatchedSymbols(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(WATCHED_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async addWatchedSymbol(symbol: string): Promise<void> {
    const watched = await this.getWatchedSymbols();
    if (!watched.includes(symbol)) {
      watched.push(symbol);
      await AsyncStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
    }
  },

  async removeWatchedSymbol(symbol: string): Promise<void> {
    const watched = await this.getWatchedSymbols();
    await AsyncStorage.setItem(
      WATCHED_KEY,
      JSON.stringify(watched.filter((s) => s !== symbol))
    );
  },
};
