import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PriceAlert } from '../services/storage';

interface Props {
  alert: PriceAlert;
  currentPrice?: number;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const AlertCard: React.FC<Props> = ({ alert, currentPrice, onDelete, onToggle }) => {
  const progress = currentPrice
    ? Math.min(
        Math.abs(currentPrice - alert.targetPrice) /
          (Math.abs(alert.targetPrice) * 0.01 || 1),
        100
      )
    : 0;

  const statusColor = alert.triggered
    ? '#F59E0B'
    : alert.active
    ? '#06D6A0'
    : '#64748B';

  const conditionIcon = alert.condition === 'above' ? '↑' : '↓';

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{alert.instrumentName}</Text>
          <Text style={styles.detail}>
            {conditionIcon} {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
            <Text style={styles.target}>{alert.targetPrice.toFixed(5)}</Text>
          </Text>
          {currentPrice != null && (
            <Text style={styles.current}>
              Current: {currentPrice.toFixed(5)}
            </Text>
          )}
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>
              {alert.triggered ? 'Triggered' : alert.active ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {!alert.triggered && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: alert.active ? '#1E293B' : '#0F172A' }]}
            onPress={() => onToggle(alert.id)}
          >
            <Text style={[styles.btnText, { color: alert.active ? '#F59E0B' : '#06D6A0' }]}>
              {alert.active ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#1E293B' }]}
          onPress={() => onDelete(alert.id)}
        >
          <Text style={[styles.btnText, { color: '#EF476F' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { color: '#E2E8F0', fontSize: 15, fontWeight: '600' },
  detail: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  target: { color: '#F59E0B', fontWeight: '700' },
  current: { color: '#64748B', fontSize: 12, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#000', fontSize: 11, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  btnText: { fontSize: 13, fontWeight: '600' },
});
