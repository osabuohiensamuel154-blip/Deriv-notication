export interface Instrument {
  symbol: string;
  name: string;
  category: string;
}

export interface InstrumentCategory {
  id: string;
  name: string;
  instruments: Instrument[];
}

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  {
    id: 'volatility',
    name: 'Volatility Indices',
    instruments: [
      { symbol: 'R_10',     name: 'Volatility 10 Index',       category: 'Volatility Indices' },
      { symbol: '1HZ10V',   name: 'Volatility 10 (1s) Index',  category: 'Volatility Indices' },
      { symbol: 'R_25',     name: 'Volatility 25 Index',       category: 'Volatility Indices' },
      { symbol: '1HZ25V',   name: 'Volatility 25 (1s) Index',  category: 'Volatility Indices' },
      { symbol: 'R_50',     name: 'Volatility 50 Index',       category: 'Volatility Indices' },
      { symbol: '1HZ50V',   name: 'Volatility 50 (1s) Index',  category: 'Volatility Indices' },
      { symbol: 'R_75',     name: 'Volatility 75 Index',       category: 'Volatility Indices' },
      { symbol: '1HZ75V',   name: 'Volatility 75 (1s) Index',  category: 'Volatility Indices' },
      { symbol: 'R_100',    name: 'Volatility 100 Index',      category: 'Volatility Indices' },
      { symbol: '1HZ100V',  name: 'Volatility 100 (1s) Index', category: 'Volatility Indices' },
      { symbol: '1HZ150V',  name: 'Volatility 150 (1s) Index', category: 'Volatility Indices' },
      { symbol: '1HZ250V',  name: 'Volatility 250 (1s) Index', category: 'Volatility Indices' },
    ],
  },
  {
    id: 'crash_boom',
    name: 'Crash/Boom Indices',
    instruments: [
      { symbol: 'CRASH300N',  name: 'Crash 300 Index',  category: 'Crash/Boom Indices' },
      { symbol: 'CRASH500',   name: 'Crash 500 Index',  category: 'Crash/Boom Indices' },
      { symbol: 'CRASH1000',  name: 'Crash 1000 Index', category: 'Crash/Boom Indices' },
      { symbol: 'BOOM300N',   name: 'Boom 300 Index',   category: 'Crash/Boom Indices' },
      { symbol: 'BOOM500',    name: 'Boom 500 Index',   category: 'Crash/Boom Indices' },
      { symbol: 'BOOM1000',   name: 'Boom 1000 Index',  category: 'Crash/Boom Indices' },
    ],
  },
  {
    id: 'jump',
    name: 'Jump Indices',
    instruments: [
      { symbol: 'JD10',  name: 'Jump 10 Index',  category: 'Jump Indices' },
      { symbol: 'JD25',  name: 'Jump 25 Index',  category: 'Jump Indices' },
      { symbol: 'JD50',  name: 'Jump 50 Index',  category: 'Jump Indices' },
      { symbol: 'JD75',  name: 'Jump 75 Index',  category: 'Jump Indices' },
      { symbol: 'JD100', name: 'Jump 100 Index', category: 'Jump Indices' },
    ],
  },
  {
    id: 'step',
    name: 'Step Indices',
    instruments: [
      { symbol: 'stpRNG',  name: 'Step Index',     category: 'Step Indices' },
      { symbol: 'stpRNG2', name: 'Step Index 200', category: 'Step Indices' },
      { symbol: 'stpRNG3', name: 'Step Index 300', category: 'Step Indices' },
    ],
  },
  {
    id: 'range_break',
    name: 'Range Break',
    instruments: [
      { symbol: 'RDBULL', name: 'Range Break 100 Index', category: 'Range Break' },
      { symbol: 'RDBEAR', name: 'Range Break 200 Index', category: 'Range Break' },
    ],
  },
  {
    id: 'forex_major',
    name: 'Forex Major',
    instruments: [
      { symbol: 'frxEURUSD', name: 'EUR/USD', category: 'Forex Major' },
      { symbol: 'frxGBPUSD', name: 'GBP/USD', category: 'Forex Major' },
      { symbol: 'frxUSDJPY', name: 'USD/JPY', category: 'Forex Major' },
      { symbol: 'frxAUDUSD', name: 'AUD/USD', category: 'Forex Major' },
      { symbol: 'frxUSDCAD', name: 'USD/CAD', category: 'Forex Major' },
      { symbol: 'frxUSDCHF', name: 'USD/CHF', category: 'Forex Major' },
      { symbol: 'frxNZDUSD', name: 'NZD/USD', category: 'Forex Major' },
    ],
  },
  {
    id: 'forex_minor',
    name: 'Forex Minor',
    instruments: [
      { symbol: 'frxEURGBP', name: 'EUR/GBP', category: 'Forex Minor' },
      { symbol: 'frxEURJPY', name: 'EUR/JPY', category: 'Forex Minor' },
      { symbol: 'frxGBPJPY', name: 'GBP/JPY', category: 'Forex Minor' },
      { symbol: 'frxAUDJPY', name: 'AUD/JPY', category: 'Forex Minor' },
      { symbol: 'frxEURCAD', name: 'EUR/CAD', category: 'Forex Minor' },
      { symbol: 'frxEURAUD', name: 'EUR/AUD', category: 'Forex Minor' },
      { symbol: 'frxGBPAUD', name: 'GBP/AUD', category: 'Forex Minor' },
      { symbol: 'frxGBPCAD', name: 'GBP/CAD', category: 'Forex Minor' },
      { symbol: 'frxAUDCAD', name: 'AUD/CAD', category: 'Forex Minor' },
      { symbol: 'frxAUDNZD', name: 'AUD/NZD', category: 'Forex Minor' },
    ],
  },
  {
    id: 'metals',
    name: 'Metals',
    instruments: [
      { symbol: 'frxXAUUSD', name: 'Gold/USD',      category: 'Metals' },
      { symbol: 'frxXAGUSD', name: 'Silver/USD',    category: 'Metals' },
      { symbol: 'frxXPDUSD', name: 'Palladium/USD', category: 'Metals' },
      { symbol: 'frxXPTUSD', name: 'Platinum/USD',  category: 'Metals' },
    ],
  },
  {
    id: 'energies',
    name: 'Energies',
    instruments: [
      { symbol: 'frxBROUSD', name: 'Brent Crude Oil',  category: 'Energies' },
      { symbol: 'frxWTIUSD', name: 'West Texas Oil',   category: 'Energies' },
      { symbol: 'WLDNGAS',   name: 'Natural Gas',      category: 'Energies' },
    ],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    instruments: [
      { symbol: 'cryBTCUSD', name: 'Bitcoin/USD',      category: 'Crypto' },
      { symbol: 'cryETHUSD', name: 'Ethereum/USD',     category: 'Crypto' },
      { symbol: 'cryXRPUSD', name: 'Ripple/USD',       category: 'Crypto' },
      { symbol: 'cryLTCUSD', name: 'Litecoin/USD',     category: 'Crypto' },
      { symbol: 'cryBCHUSD', name: 'Bitcoin Cash/USD', category: 'Crypto' },
      { symbol: 'cryEOSUSD', name: 'EOS/USD',          category: 'Crypto' },
    ],
  },
  {
    id: 'indices',
    name: 'Stock Indices',
    instruments: [
      { symbol: 'WLDUSD',  name: 'Wall Street 30',  category: 'Stock Indices' },
      { symbol: 'SPC',     name: 'US 500',           category: 'Stock Indices' },
      { symbol: 'NASDAQ',  name: 'US Tech 100',      category: 'Stock Indices' },
      { symbol: 'FTSE',    name: 'UK 100',           category: 'Stock Indices' },
      { symbol: 'HSI',     name: 'Hong Kong 50',     category: 'Stock Indices' },
      { symbol: 'AEX',     name: 'Netherlands 25',   category: 'Stock Indices' },
      { symbol: 'OTC_DJI', name: 'Dow Jones',        category: 'Stock Indices' },
    ],
  },
  {
    id: 'basket',
    name: 'Basket Indices',
    instruments: [
      { symbol: 'USDBASK',  name: 'USD Basket',  category: 'Basket Indices' },
      { symbol: 'EURBASK',  name: 'EUR Basket',  category: 'Basket Indices' },
      { symbol: 'GBPBASK',  name: 'GBP Basket',  category: 'Basket Indices' },
      { symbol: 'AUDBASK',  name: 'AUD Basket',  category: 'Basket Indices' },
      { symbol: 'GOLDBASK', name: 'Gold Basket', category: 'Basket Indices' },
    ],
  },
];

export const ALL_INSTRUMENTS: Instrument[] = INSTRUMENT_CATEGORIES.flatMap(
  (cat) => cat.instruments
);

export const getInstrumentBySymbol = (symbol: string): Instrument | undefined =>
  ALL_INSTRUMENTS.find((i) => i.symbol === symbol);

export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    volatility:   '#FF6B35',
    crash_boom:   '#E63946',
    jump:         '#8338EC',
    step:         '#06D6A0',
    range_break:  '#2EC4B6',
    forex_major:  '#118AB2',
    forex_minor:  '#0077B6',
    metals:       '#FFB703',
    energies:     '#FB8500',
    crypto:       '#F77F00',
    indices:      '#457B9D',
    basket:       '#1D3557',
  };
  return colors[categoryId] || '#6C757D';
};
