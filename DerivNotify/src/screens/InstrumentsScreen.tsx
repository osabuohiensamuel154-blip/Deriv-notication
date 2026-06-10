import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ActiveSymbol,
  SymbolCategory,
  fetchActiveSymbols,
  getCategoryEmoji,
  groupBySubmarket,
  toInstrument,
} from '../services/symbolsService';
import { PriceCard } from '../components/PriceCard';
import { storageService, PriceAlert } from '../services/storage';
import { alertMonitor } from '../services/alertMonitor';

interface AlertModalState {
  symbol: ActiveSymbol;
  price: number;
}

// ─── Alert bottom-sheet ──────────────────────────────────────────────────────
const AlertModal: React.FC<{
  state: AlertModalState | null;
  alertPrice: string;
  condition: 'above' | 'below';
  onChangePrice: (v: string) => void;
  onChangeCondition: (v: 'above' | 'below') => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ state, alertPrice, condition, onChangePrice, onChangeCondition, onSave, onClose }) => (
  <Modal visible={!!state} transparent animationType="slide">
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={onClose} />
      <ScrollView
        style={styles.modalSheet}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Set Price Alert</Text>
        {state && (
          <>
            <Text style={styles.modalName}>{state.symbol.display_name}</Text>
            <Text style={styles.modalSub}>
              Current: <Text style={styles.modalPrice}>{state.price.toFixed(5)}</Text>
            </Text>

            <Text style={styles.label}>Notify me when price is:</Text>
            <View style={styles.condRow}>
              {(['above', 'below'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.condBtn, condition === c && styles.condBtnOn]}
                  onPress={() => onChangeCondition(c)}
                >
                  <Text style={[styles.condTxt, condition === c && styles.condTxtOn]}>
                    {c === 'above' ? '↑  Above' : '↓  Below'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Price:</Text>
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

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                <Text style={styles.saveTxt}>Set Alert 🔔</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export const InstrumentsScreen: React.FC = () => {
  const [categories, setCategories] = useState<SymbolCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SymbolCategory | null>(null);
  const [search, setSearch] = useState('');
  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const loadSymbols = useCallback(async (force = false) => {
    setError(null);
    setLoading(true);
    try {
      const symbols = await fetchActiveSymbols(force);
      setCategories(groupBySubmarket(symbols));
    } catch (e: any) {
      setError('Could not load instruments. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSymbols(); }, [loadSymbols]);

  const openAlert = (sym: ActiveSymbol, price: number) => {
    setAlertModal({ symbol: sym, price });
    setAlertPrice(price.toFixed(5));
    setAlertCondition('above');
  };

  const saveAlert = async () => {
    if (!alertModal) return;
    const target = parseFloat(alertPrice);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid target price.');
      return;
    }
    const newAlert: PriceAlert = {
      id: `${alertModal.symbol.symbol}_${Date.now()}`,
      symbol: alertModal.symbol.symbol,
      instrumentName: alertModal.symbol.display_name,
      category: alertModal.symbol.submarket_display_name,
      condition: alertCondition,
      targetPrice: target,
      currentPrice: alertModal.price,
      createdAt: Date.now(),
      triggered: false,
      active: true,
    };
    await storageService.saveAlert(newAlert);
    await alertMonitor.refresh();
    setAlertModal(null);
    Alert.alert(
      '🔔 Alert Set!',
      `You'll be notified when ${alertModal.symbol.display_name} goes ${alertCondition} ${target.toFixed(5)}`
    );
  };

  // ── Category drill-down ──
  if (selectedCategory) {
    const filteredInstruments = search
      ? selectedCategory.instruments.filter(
          (s) =>
            s.display_name.toLowerCase().includes(search.toLowerCase()) ||
            s.symbol.toLowerCase().includes(search.toLowerCase())
        )
      : selectedCategory.instruments;

    return (
      <View style={styles.container}>
        <View style={[styles.catHeader, { borderBottomColor: selectedCategory.color }]}>
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setSearch(''); }}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.catTitle, { color: selectedCategory.color }]}>
            {selectedCategory.name}
          </Text>
          <Text style={styles.catCount}>{selectedCategory.instruments.length} instruments</Text>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${selectedCategory.name}...`}
            placeholderTextColor="#64748B"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn2}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredInstruments}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <PriceCard
              instrument={toInstrument(item)}
              categoryColor={selectedCategory.color}
              onSetAlert={(_, price) => openAlert(item, price)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.noResults}>No instruments match "{search}"</Text>
          }
        />

        <AlertModal
          state={alertModal}
          alertPrice={alertPrice}
          condition={alertCondition}
          onChangePrice={setAlertPrice}
          onChangeCondition={setAlertCondition}
          onSave={saveAlert}
          onClose={() => setAlertModal(null)}
        />
      </View>
    );
  }

  // ── Category list ──
  const filteredCategories = search
    ? categories
        .map((cat) => ({
            ...cat,
            instruments: cat.instruments.filter(
              (s) =>
                s.display_name.toLowerCase().includes(search.toLowerCase()) ||
                s.symbol.toLowerCase().includes(search.toLowerCase())
            ),
          }))
        .filter((cat) => cat.instruments.length > 0)
    : categories;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search all instruments..."
          placeholderTextColor="#64748B"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn2}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingTxt}>Loading all Deriv instruments…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadSymbols(true)}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.totalTxt}>
            {categories.reduce((n, c) => n + c.instruments.length, 0)} instruments · {categories.length} categories
          </Text>
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catCard, { borderLeftColor: item.color }]}
                onPress={() => { setSelectedCategory(item); setSearch(''); }}
              >
                <View style={[styles.catIcon, { backgroundColor: item.color + '22' }]}>
                  <Text style={styles.catEmoji}>{getCategoryEmoji(item.id)}</Text>
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{item.name}</Text>
                  <Text style={styles.catMeta}>
                    {item.marketName} · {item.instruments.length} instruments
                  </Text>
                </View>
                <Text style={[styles.catArrow, { color: item.color }]}>›</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
          />
          <TouchableOpacity style={styles.refreshRow} onPress={() => loadSymbols(true)}>
            <Text style={styles.refreshTxt}>↻  Refresh instrument list</Text>
          </TouchableOpacity>
        </>
      )}

      <AlertModal
        state={alertModal}
        alertPrice={alertPrice}
        condition={alertCondition}
        onChangePrice={setAlertPrice}
        onChangeCondition={setAlertCondition}
        onSave={saveAlert}
        onClose={() => setAlertModal(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', margin: 16, borderRadius: 12, paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#E2E8F0', fontSize: 15, paddingVertical: 12 },
  clearBtn2: { color: '#64748B', fontSize: 16, paddingLeft: 8 },
  totalTxt: {
    color: '#64748B', fontSize: 12, textAlign: 'center',
    marginBottom: 8, marginTop: -8,
  },
  catCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 4,
    padding: 13, borderLeftWidth: 4, elevation: 2,
  },
  catIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 21 },
  catInfo: { flex: 1, marginLeft: 12 },
  catName: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  catMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  catArrow: { fontSize: 24, fontWeight: '300' },
  catHeader: { backgroundColor: '#16213E', padding: 16, borderBottomWidth: 2 },
  backBtn: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  catTitle: { fontSize: 20, fontWeight: '800' },
  catCount: { color: '#64748B', fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  loadingTxt: { color: '#64748B', marginTop: 16, fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorTxt: { color: '#EF476F', fontSize: 14, marginTop: 12, textAlign: 'center', marginHorizontal: 32 },
  retryBtn: {
    marginTop: 16, backgroundColor: '#FF6B35',
    borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12,
  },
  retryTxt: { color: '#FFF', fontWeight: '700' },
  noResults: { color: '#64748B', textAlign: 'center', marginTop: 40, fontSize: 14 },
  refreshRow: { alignItems: 'center', paddingVertical: 12 },
  refreshTxt: { color: '#64748B', fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalDismiss: { flex: 1 },
  modalSheet: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalContent: { padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#2D3748', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#E2E8F0', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalName: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 4 },
  modalSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  modalPrice: { color: '#FF6B35', fontWeight: '700' },
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  condRow: { flexDirection: 'row', gap: 12 },
  condBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2D3748', alignItems: 'center' },
  condBtnOn: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  condTxt: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  condTxtOn: { color: '#FFF' },
  priceInput: {
    backgroundColor: '#0D0D1A', borderRadius: 10, padding: 16,
    color: '#E2E8F0', fontSize: 20, fontFamily: 'monospace',
    borderWidth: 1, borderColor: '#2D3748', letterSpacing: 1,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2D3748', alignItems: 'center' },
  cancelTxt: { color: '#94A3B8', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#FF6B35', alignItems: 'center' },
  saveTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
