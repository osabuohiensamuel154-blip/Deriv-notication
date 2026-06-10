import { useEffect, useRef, useState } from 'react';
import { derivApi, TickData } from '../services/derivApi';

export function useDerivPrice(symbol: string | null) {
  const [tick, setTick] = useState<TickData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setIsConnecting(true);
    setTick(null);

    unsubRef.current = derivApi.subscribe(symbol, (data) => {
      setIsConnecting(false);
      setTick(data);
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [symbol]);

  return { tick, isConnecting };
}
