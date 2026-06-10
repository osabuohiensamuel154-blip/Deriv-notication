import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  INSTRUMENT_CATEGORIES,
  InstrumentCategory,
  Instrument,
  getCategoryColor,
} from '../constants/instruments';
import { PriceCard } from '../components/PriceCard';
import { storageService, PriceAlert } from '../services/storage';
import { alertMonitor } from '../services/alertMonitor';

interface AlertModalState {
  instrument: Instrument;
  price: number;
}

const AlertModal: React.FC<{
  state: AlertModalState | null;
  alertPrice: string;
  alertCondition: 'above' | 'below';
  onChangePrice: (v: string) => void;
  onChangeCondition: (v: 'above' | 'below') => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ state, alertPrice, alertCondition, onChangePrice, onChangeCondition, onSave, onClose }) => (
  <Modal visible={!!state} transparent animationType="slide">
    {/* KeyboardAvoidingView pushes the sheet above the keyboard */}
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={onClose} />
      <ScrollView
        style={styles.modalBox}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Set Price Alert</Text>
        {state && (
          <>
            <Text style={styles.modalInst}>{state.instrument.name}</Text>
            <Text style={styles.modalCurrent}>
              Current Price:{' '}
              <Text style={styles.modalPrice}>{state.price.toFixed(5)}</Text>
            </Text>

            <Text style={styles.modalLabel}>Notify me when price is:</Text>
            <View style={styles.condRow}>
              <TouchableOpacity
                style={[styles.condBtn, alertCondition === 'above' && styles.condBtnActive]}
                onPress={() => onChangeCondition('above')}
              >
                <Text style={[styles.condBtnText, alertCondition === 'above' && styles.condBtnTextActive]}>
                  ↑  Above
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.condBtn, alertCondition === 'below' && styles.condBtnActive]}
                onPress={() => onChangeCondition('below')}
              >
                <Text style={[styles.condBtnText, alertCondition === 'below' && styles.condBtnTextActive]}>
                  ↓  Below
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Target Price:</Text>
            <TextInput
              style={styles.priceInput}
              value={alertPrice}
              onChangeText={onChangePrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#64748B"
              placeholder="Enter target price"
              returnKeyType="done"
              onSubmitEditing={onSave}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                <Text style={styles.saveText}>Set Alert 🔔</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export const InstrumentsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertModalState, setAlertModalState] = useState<AlertModalState | null>(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const filteredCategories = searchQuery
    ? INSTRUMENT_CATEGORIES.map((cat) => ({
        ...cat,
        instruments: cat.instruments.filter(
          (inst) =>
            inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.instruments.length > 0)
    : INSTRUMENT_CATEGORIES;

  const openAlertModal = (instrument: Instrument, price: number) => {
    setAlertModalState({ instrument, price });
    setAlertPrice(price.toFixed(5));
    setAlertCondition('above');
  };

  const closeAlertModal = () => setAlertModalState(null);

  const saveAlert = async () => {
    if (!alertModalState) return;
    const target = parseFloat(alertPrice);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid target price.');
      return;
    }
    const newAlert: PriceAlert = {
      id: `${alertModalState.instrument.symbol}_${Date.now()}`,
      symbol: alertModalState.instrument.symbol,
      instrumentName: alertModalState.instrument.name,
      category: alertModalState.instrument.category,
      condition: alertCondition,
      targetPrice: target,
      currentPrice: alertModalState.price,
      createdAt: Date.now(),
      triggered: false,
      active: true,
    };
    await storageService.saveAlert(newAlert);
    // Immediately start monitoring this new alert
    await alertMonitor.refresh();
    closeAlertModal();
    Alert.alert(
      '🔔 Alert Set!',
      `You'll be notified when ${alertModalState.instrument.name} goes ${alertCondition} ${target.toFixed(5)}`
    );
  };

  if (selectedCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.categoryHeader}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.categoryTitle, { color: getCategoryColor(selectedCategory.id) }]}>
            {selectedCategory.name}
          </Text>
          <Text style={styles.categoryCount}>{selectedCategory.instruments.length} instruments</Text>
        </View>
        <FlatList
          data={selectedCategory.instruments}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <PriceCard
              instrument={item}
              categoryColor={getCategoryColor(selectedCategory.id)}
              onSetAlert={openAlertModal}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        <AlertModal
          state={alertModalState}
          alertPrice={alertPrice}
          alertCondition={alertCondition}
          onChangePrice={setAlertPrice}
          onChangeCondition={setAlertCondition}
          onSave={saveAlert}
          onClose={closeAlertModal}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search instruments..."
          placeholderTextColor="#64748B"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catCard, { borderLeftColor: getCategoryColor(item.id) }]}
            onPress={() => setSelectedCategory(item)}
          >
            <View style={[styles.catIcon, { backgroundColor: getCategoryColor(item.id) + '22' }]}>
              <Text style={styles.catIconText}>{getCategoryEmoji(item.id)}</Text>
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{item.name}</Text>
              <Text style={styles.catCount}>{item.instruments.length} instruments</Text>
            </View>
            <Text style={[styles.catArrow, { color: getCategoryColor(item.id) }]}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
      />
      <AlertModal
        state={alertModalState}
        alertPrice={alertPrice}
        alertCondition={alertCondition}
        onChangePrice={setAlertPrice}
        onChangeCondition={setAlertCondition}
        onSave={saveAlert}
        onClose={closeAlertModal}
      />
    </View>
  );
};

function getCategoryEmoji(id: string): string {
  const map: Record<string, string> = {
    volatility: '📈', crash_boom: '💥', jump: '🚀', step: '📶',
    range_break: '↔️', forex_major: '💱', forex_minor: '💰',
    metals: '🥇', energies: '⚡', crypto: '₿', indices: '🏦', basket: '🧺',
  };
  return map[id] ?? '📊';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#E2E8F0', fontSize: 15, paddingVertical: 12 },
  clearSearch: { color: '#64748B', fontSize: 16, paddingLeft: 8 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
  },
  catIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catIconText: { fontSize: 22 },
  catInfo: { flex: 1, marginLeft: 12 },
  catName: { color: '#E2E8F0', fontSize: 15, fontWeight: '700' },
  catCount: { color: '#64748B', fontSize: 12, marginTop: 2 },
  catArrow: { fontSize: 24, fontWeight: '300' },
  categoryHeader: { backgroundColor: '#16213E', padding: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600' },
  categoryTitle: { fontSize: 20, fontWeight: '800' },
  categoryCount: { color: '#64748B', fontSize: 13, marginTop: 2 },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  modalDismiss: { flex: 1 },
  modalBox: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#2D3748',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { color: '#E2E8F0', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalInst: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 4 },
  modalCurrent: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  modalPrice: { color: '#FF6B35', fontWeight: '700' },
  modalLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  condRow: { flexDirection: 'row', gap: 12 },
  condBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#2D3748', alignItems: 'center',
  },
  condBtnActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  condBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  condBtnTextActive: { color: '#FFF' },
  priceInput: {
    backgroundColor: '#0D0D1A',
    borderRadius: 10,
    padding: 16,
    color: '#E2E8F0',
    fontSize: 20,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#2D3748',
    letterSpacing: 1,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#2D3748', alignItems: 'center',
  },
  cancelText: { color: '#94A3B8', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#FF6B35', alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
