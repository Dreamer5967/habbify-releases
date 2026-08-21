import { useState, useEffect, useCallback, useRef } from 'react';
import { WSMessage } from '../types';

interface UseWebSocketProps {
  url?: string;
  onMessage: (message: WSMessage) => void;
}

export function useWebSocket({ url = 'ws://localhost:8000/ws', onMessage }: UseWebSocketProps) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const backoff = useRef(1000);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    try {
      // Determine WebSocket URL relative to current host if needed
      const wsUrl = url.startsWith('ws') 
        ? url 
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${url}`;

      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
        backoff.current = 1000;
      };

      socket.onclose = () => {
        setConnected(false);
        ws.current = null;

        reconnectTimeout.current = window.setTimeout(() => {
          backoff.current = Math.min(backoff.current * 1.5, 5000);
          connect();
        }, backoff.current);
      };

      socket.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current(message);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      socket.onerror = () => {
        // Handled in onclose
      };
    } catch (err) {
      console.error('Failed to connect to WS:', err);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WSMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { connected, lastMessage, sendMessage };
}
