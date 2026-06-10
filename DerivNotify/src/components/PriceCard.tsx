import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Instrument } from '../constants/instruments';
import { useDerivPrice } from '../hooks/useDerivPrice';

interface Props {
  instrument: Instrument;
  categoryColor: string;
  onSetAlert: (instrument: Instrument, price: number) => void;
}

export const PriceCard: React.FC<Props> = ({ instrument, categoryColor, onSetAlert }) => {
  const { tick, isConnecting } = useDerivPrice(instrument.symbol);
  const prevPrice = useRef<number | null>(null);
  const flashAnim = useRef(new Animated.Value(1)).current;
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!tick) return;
    if (prevPrice.current !== null) {
      const dir = tick.price > prevPrice.current ? 'up' : tick.price < prevPrice.current ? 'down' : null;
      setPriceDirection(dir);
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    prevPrice.current = tick.price;
  }, [tick?.price]);

  const priceColor = priceDirection === 'up' ? '#06D6A0' : priceDirection === 'down' ? '#EF476F' : '#FFFFFF';

  return (
    <View style={[styles.card, { borderLeftColor: categoryColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{instrument.name}</Text>
          <Text style={styles.symbol}>{instrument.symbol}</Text>
        </View>
        <Animated.View style={{ opacity: flashAnim }}>
          {isConnecting ? (
            <Text style={styles.connecting}>Connecting...</Text>
          ) : tick ? (
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: priceColor }]}>
                {priceDirection === 'up' ? '▲ ' : priceDirection === 'down' ? '▼ ' : ''}
                {tick.price.toFixed(tick.price > 10 ? 3 : 5)}
              </Text>
            </View>
          ) : (
            <Text style={styles.connecting}>--</Text>
          )}
        </Animated.View>
      </View>
      {tick && (
        <View style={styles.footer}>
          <Text style={styles.subPrice}>Bid: {tick.bid.toFixed(5)}</Text>
          <Text style={styles.subPrice}>Ask: {tick.ask.toFixed(5)}</Text>
          <TouchableOpacity
            style={[styles.alertBtn, { backgroundColor: categoryColor }]}
            onPress={() => onSetAlert(instrument, tick.price)}
          >
            <Text style={styles.alertBtnText}>Set Alert</Text>
          </TouchableOpacity>
        </View>
      )}
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
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: '#E2E8F0', fontSize: 15, fontWeight: '600' },
  symbol: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  connecting: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  subPrice: { color: '#64748B', fontSize: 11, flex: 1 },
  alertBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
