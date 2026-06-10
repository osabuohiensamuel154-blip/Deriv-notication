import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PriceAlert, storageService } from '../services/storage';
import { AlertCard } from '../components/AlertCard';
import { derivApi, TickData } from '../services/derivApi';
import { notificationService } from '../services/notifications';

export const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const unsubsRef = useRef<Record<string, () => void>>({});

  const loadAlerts = useCallback(async () => {
    const all = await storageService.getAlerts();
    setAlerts(all.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Subscribe to live prices for all alert symbols
  useEffect(() => {
    const activeSymbols = [...new Set(
      alerts.filter((a) => a.active && !a.triggered).map((a) => a.symbol)
    )];

    // Unsubscribe removed symbols
    Object.keys(unsubsRef.current).forEach((sym) => {
      if (!activeSymbols.includes(sym)) {
        unsubsRef.current[sym]?.();
        delete unsubsRef.current[sym];
      }
    });

    // Subscribe to new symbols
    activeSymbols.forEach((sym) => {
      if (unsubsRef.current[sym]) return;
      unsubsRef.current[sym] = derivApi.subscribe(sym, async (tick: TickData) => {
        setPrices((prev) => ({ ...prev, [sym]: tick.price }));

        // Check alerts for this symbol
        const current = await storageService.getAlerts();
        const matching = current.filter(
          (a) => a.symbol === sym && a.active && !a.triggered
        );
        for (const alert of matching) {
          const triggered =
            (alert.condition === 'above' && tick.price >= alert.targetPrice) ||
            (alert.condition === 'below' && tick.price <= alert.targetPrice);

          if (triggered) {
            await storageService.markAlertTriggered(alert.id);
            await notificationService.sendPriceAlert(
              alert.instrumentName,
              alert.condition,
              alert.targetPrice,
              tick.price
            );
            loadAlerts();
          }
        }
      });
    });

    return () => {
      Object.values(unsubsRef.current).forEach((unsub) => unsub());
      unsubsRef.current = {};
    };
  }, [alerts, loadAlerts]);

  const deleteAlert = async (id: string) => {
    Alert.alert('Delete Alert', 'Remove this price alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storageService.deleteAlert(id);
          loadAlerts();
        },
      },
    ]);
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;
    await storageService.saveAlert({ ...alert, active: !alert.active });
    loadAlerts();
  };

  const clearTriggered = async () => {
    const triggered = alerts.filter((a) => a.triggered);
    for (const a of triggered) await storageService.deleteAlert(a.id);
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
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{triggeredCount}</Text>
          <Text style={styles.statLabel}>Triggered</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{alerts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Filter tabs */}
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
            {filter === 'active' ? 'No active alerts' : filter === 'triggered' ? 'No triggered alerts' : 'No alerts yet'}
          </Text>
          <Text style={styles.emptySub}>
            Go to Instruments tab to set price alerts
          </Text>
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
    padding: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#E2E8F0', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 2 },
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
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 6, textAlign: 'center', marginHorizontal: 32 },
});
