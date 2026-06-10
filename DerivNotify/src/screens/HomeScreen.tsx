import React, { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PriceAlert, storageService } from '../services/storage';
import { alertMonitor } from '../services/alertMonitor';
import { INSTRUMENT_CATEGORIES } from '../constants/instruments';
import { useDerivPrice } from '../hooks/useDerivPrice';

const QUICK_WATCH = ['R_100', '1HZ10V', 'frxEURUSD', 'frxXAUUSD', 'CRASH1000', 'BOOM1000'];

const QuickTicker: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { tick } = useDerivPrice(symbol);
  const inst = INSTRUMENT_CATEGORIES.flatMap((c) => c.instruments).find(
    (i) => i.symbol === symbol
  );
  const name = inst?.name ?? symbol;
  const shortName = name.replace(' Index', '').replace('/USD', '').replace('Boom ', 'Boom ').replace('Crash ', 'Crash ');

  return (
    <View style={styles.ticker}>
      <Text style={styles.tickerName} numberOfLines={1}>{shortName}</Text>
      <Text style={styles.tickerPrice}>
        {tick ? tick.price.toFixed(tick.price > 100 ? 3 : 5) : '···'}
      </Text>
      {tick && (
        <Text style={styles.tickerSub}>
          {tick.bid.toFixed(tick.bid > 100 ? 3 : 5)}
        </Text>
      )}
    </View>
  );
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAlerts = useCallback(async () => {
    const all = await storageService.getAlerts();
    setAlerts(all.filter((a) => a.active && !a.triggered).slice(0, 5));
  }, []);

  // Refresh alerts whenever we return to Home tab
  useFocusEffect(
    useCallback(() => {
      loadAlerts();
      timerRef.current = setInterval(loadAlerts, 3000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [loadAlerts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    await alertMonitor.refresh();
    setRefreshing(false);
  };

  const activeCount = alerts.length;
  const categoryCount = INSTRUMENT_CATEGORIES.length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Deriv Price Alerts</Text>
        <Text style={styles.heroSub}>Real-time notifications for trading instruments</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{categoryCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#06D6A0' }]}>Live</Text>
            <Text style={styles.statLabel}>Prices</Text>
          </View>
        </View>
      </View>

      {/* Quick Tickers */}
      <Text style={styles.sectionTitle}>Live Prices</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickersRow}>
        {QUICK_WATCH.map((sym) => (
          <QuickTicker key={sym} symbol={sym} />
        ))}
      </ScrollView>

      {/* Quick actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF6B35' }]}
          onPress={() => navigation.navigate('Instruments')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Browse Instruments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#8338EC' }]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>My Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Active alerts preview */}
      {alerts.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: '#06D6A0' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{alert.instrumentName}</Text>
                <Text style={styles.alertDetail}>
                  {alert.condition === 'above' ? '↑ Above' : '↓ Below'}{' '}
                  <Text style={{ color: '#FF6B35', fontWeight: '700' }}>
                    {alert.targetPrice.toFixed(5)}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.viewAll}>View all alerts →</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyText}>No active alerts</Text>
          <Text style={styles.emptySub}>Browse instruments and set a price alert</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Instruments')}
          >
            <Text style={styles.emptyBtnText}>Browse Instruments</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  hero: { backgroundColor: '#16213E', padding: 24, paddingTop: 32 },
  heroTitle: { color: '#FF6B35', fontSize: 26, fontWeight: '800' },
  heroSub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#E2E8F0', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#64748B', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#2D3748' },
  sectionTitle: {
    color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginTop: 24, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase',
  },
  tickersRow: { paddingLeft: 16 },
  ticker: {
    backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12,
    marginRight: 10, minWidth: 120,
  },
  tickerName: { color: '#94A3B8', fontSize: 11 },
  tickerPrice: { color: '#FF6B35', fontSize: 17, fontWeight: '700', marginTop: 4, fontFamily: 'monospace' },
  tickerSub: { color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 24 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon: { fontSize: 26 },
  actionText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginTop: 6 },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    borderRadius: 10, marginHorizontal: 16, marginVertical: 4, padding: 12, gap: 12,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertName: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  alertDetail: { color: '#64748B', fontSize: 12, marginTop: 2 },
  viewAll: { color: '#FF6B35', textAlign: 'center', marginVertical: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 6 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#FF6B35', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
});
