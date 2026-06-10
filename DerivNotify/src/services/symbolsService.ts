import AsyncStorage from '@react-native-async-storage/async-storage';

const DERIV_WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';
const CACHE_KEY = '@deriv_active_symbols_v2';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export interface ActiveSymbol {
  symbol: string;
  display_name: string;
  market: string;
  market_display_name: string;
  submarket: string;
  submarket_display_name: string;
  exchange_is_open: number;
  is_trading_suspended: number;
  pip: string;
}

export interface SymbolCategory {
  id: string;
  name: string;
  market: string;
  marketName: string;
  instruments: ActiveSymbol[];
  color: string;
}

// Fetch ALL active symbols from Deriv's API (with 6-hour cache)
export async function fetchActiveSymbols(forceRefresh = false): Promise<ActiveSymbol[]> {
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { symbols, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && symbols?.length > 0) {
          return symbols;
        }
      }
    } catch {
      // ignore cache errors
    }
  }

  const symbols = await new Promise<ActiveSymbol[]>((resolve, reject) => {
    const ws = new WebSocket(DERIV_WS_URL);
    const timer = setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 20000);

    ws.onopen = () => {
      ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.msg_type === 'active_symbols') {
          clearTimeout(timer);
          ws.close();
          resolve((data.active_symbols as ActiveSymbol[]) || []);
        }
      } catch {
        clearTimeout(timer);
        ws.close();
        reject(new Error('Parse error'));
      }
    };

    ws.onerror = () => { clearTimeout(timer); reject(new Error('WS error')); };
  });

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ symbols, timestamp: Date.now() }));
  } catch {
    // ignore
  }

  return symbols;
}

// Group symbols by submarket, sorted with Derived first
export function groupBySubmarket(symbols: ActiveSymbol[]): SymbolCategory[] {
  const groups = new Map<string, SymbolCategory>();

  for (const sym of symbols) {
    // Include all symbols (even suspended ones so user can see them)
    const key = sym.submarket;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: sym.submarket_display_name,
        market: sym.market,
        marketName: sym.market_display_name,
        instruments: [],
        color: getSubmarketColor(key),
      });
    }
    groups.get(key)!.instruments.push(sym);
  }

  // Sort: synthetic (Derived) first, then by market, then name
  return Array.from(groups.values()).sort((a, b) => {
    if (a.market === 'synthetic_index' && b.market !== 'synthetic_index') return -1;
    if (b.market === 'synthetic_index' && a.market !== 'synthetic_index') return 1;
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    return a.name.localeCompare(b.name);
  });
}

// Convert an ActiveSymbol to the simple Instrument shape PriceCard expects
export function toInstrument(sym: ActiveSymbol) {
  return {
    symbol: sym.symbol,
    name: sym.display_name,
    category: sym.submarket_display_name,
  };
}

function getSubmarketColor(submarket: string): string {
  const map: Record<string, string> = {
    random_index:           '#FF6B35',
    crash_index:            '#E63946',
    jump_index:             '#8338EC',
    step_index:             '#06D6A0',
    range_break:            '#2EC4B6',
    major_pairs:            '#118AB2',
    minor_pairs:            '#0077B6',
    smart_fx:               '#0096C7',
    forex_exotic:           '#023E8A',
    metals:                 '#FFB703',
    energy:                 '#FB8500',
    soft_commodity:         '#E9C46A',
    cryptocurrencies:       '#F77F00',
    market_index:           '#457B9D',
    basket_index:           '#1D3557',
    otc_index:              '#386641',
    drift_switch_index:     '#7209B7',
    dex_index:              '#560BAD',
    hybrid_index:           '#480CA8',
    multi_step_index:       '#3A0CA3',
    pairs_arbitrage:        '#3F37C9',
    skewed_step:            '#4361EE',
    stable_spread:          '#4895EF',
    spot_vol_index:         '#4CC9F0',
    trek_index:             '#7FBA00',
    volatility_switch:      '#00B4D8',
    exponential_growth:     '#0096C7',
    tactical_index:         '#023E8A',
    equities:               '#2D6A4F',
    etf_index:              '#40916C',
    conversion:             '#52B788',
  };
  return map[submarket] ?? '#6C757D';
}

export function getCategoryEmoji(submarket: string): string {
  const map: Record<string, string> = {
    random_index:       '📈',
    crash_index:        '💥',
    jump_index:         '🚀',
    step_index:         '📶',
    range_break:        '↔️',
    major_pairs:        '💱',
    minor_pairs:        '💰',
    smart_fx:           '🔁',
    forex_exotic:       '🌍',
    metals:             '🥇',
    energy:             '⚡',
    soft_commodity:     '🌾',
    cryptocurrencies:   '₿',
    market_index:       '🏦',
    basket_index:       '🧺',
    otc_index:          '🏛️',
    drift_switch_index: '🔀',
    dex_index:          '🔬',
    hybrid_index:       '⚗️',
    multi_step_index:   '🪜',
    pairs_arbitrage:    '⚖️',
    skewed_step:        '↗️',
    stable_spread:      '🔒',
    spot_vol_index:     '🎯',
    trek_index:         '🧭',
    volatility_switch:  '🔃',
    exponential_growth: '📉',
    tactical_index:     '🎖️',
    equities:           '📋',
    etf_index:          '📦',
    conversion:         '🔄',
  };
  return map[submarket] ?? '📊';
}
