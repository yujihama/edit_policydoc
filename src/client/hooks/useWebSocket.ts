import { useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (url: string, options: WebSocketOptions = {}) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = () => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        onOpen?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        onClose?.();

        // 自動再接続
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        onError?.(error);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const sendMessage = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const disconnect = () => {
    ws.current?.close();
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
};

