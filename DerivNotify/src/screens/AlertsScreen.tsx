import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PriceAlert, storageService } from '../services/storage';
import { AlertCard } from '../components/AlertCard';
import { alertMonitor } from '../services/alertMonitor';
import { derivApi, TickData } from '../services/derivApi';

export const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const unsubsRef = useRef<Record<string, () => void>>({});
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAlerts = useCallback(async () => {
    const all = await storageService.getAlerts();
    setAlerts(all.sort((a, b) => b.createdAt - a.createdAt));
    // Seed prices from the global monitor cache
    const cached: Record<string, number> = {};
    for (const a of all) {
      const p = alertMonitor.getLatestPrice(a.symbol);
      if (p !== undefined) cached[a.symbol] = p;
    }
    setPrices((prev) => ({ ...prev, ...cached }));
  }, []);

  // Reload every time the user navigates to this tab
  useFocusEffect(
    useCallback(() => {
      loadAlerts();
      alertMonitor.refresh();

      // Poll for price updates while on this screen
      refreshTimerRef.current = setInterval(loadAlerts, 3000);
      return () => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      };
    }, [loadAlerts])
  );

  // Subscribe to live prices for visible alerts
  useEffect(() => {
    const symbols = [...new Set(alerts.map((a) => a.symbol))];

    // Drop stale subscriptions
    for (const sym of Object.keys(unsubsRef.current)) {
      if (!symbols.includes(sym)) {
        unsubsRef.current[sym]?.();
        delete unsubsRef.current[sym];
      }
    }

    // Add new subscriptions
    for (const sym of symbols) {
      if (!unsubsRef.current[sym]) {
        unsubsRef.current[sym] = derivApi.subscribe(sym, (tick: TickData) => {
          setPrices((prev) => ({ ...prev, [sym]: tick.price }));
        });
      }
    }

    return () => {
      for (const unsub of Object.values(unsubsRef.current)) unsub();
      unsubsRef.current = {};
    };
  }, [alerts]);

  const deleteAlert = (id: string) => {
    Alert.alert('Delete Alert', 'Remove this price alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteAlert(id);
          await alertMonitor.refresh();
          loadAlerts();
        },
      },
    ]);
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;
    await storageService.saveAlert({ ...alert, active: !alert.active });
    await alertMonitor.refresh();
    loadAlerts();
  };

  const clearTriggered = async () => {
    for (const a of alerts.filter((x) => x.triggered)) {
      await storageService.deleteAlert(a.id);
    }
    loadAlerts();
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.active && !a.triggered;
    if (filter === 'triggered') return a.triggered;
    return true;
  });

  const triggeredCount = alerts.filter((a) => a.triggered).length;
  const activeCount = alerts.filter((a) => a.active && !a.triggered).length;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{triggeredCount}</Text>
          <Text style={styles.statLabel}>Triggered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{alerts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['all', 'active', 'triggered'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {triggeredCount > 0 && filter !== 'active' && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearTriggered}>
          <Text style={styles.clearText}>Clear triggered ({triggeredCount})</Text>
        </TouchableOpacity>
      )}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>
            {filter === 'active'
              ? 'No active alerts'
              : filter === 'triggered'
              ? 'No triggered alerts'
              : 'No alerts yet'}
          </Text>
          <Text style={styles.emptySub}>Go to Markets tab to set price alerts</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              currentPrice={prices[item.symbol]}
              onDelete={deleteAlert}
              onToggle={toggleAlert}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#16213E',
    paddingVertical: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#E2E8F0', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2D3748', marginVertical: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    margin: 16,
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#FF6B35' },
  tabText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  clearBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 52 },
  emptyText: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    marginHorizontal: 32,
  },
});
