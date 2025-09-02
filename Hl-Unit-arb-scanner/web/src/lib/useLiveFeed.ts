
import { useEffect, useRef, useState } from 'react';
import type { Opportunity } from './types';

export function useLiveFeed() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'opps') setOpps(msg.data);
      } catch {}
    };
    return () => { ws.close(); };
  }, []);

  return { opps, connected };
}
