import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket.connected) socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = (err: any) => {
      console.error('Socket connect error:', err);
      toast.error('Disconnected from real-time server');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [isAuthenticated]);

  return { socket, isConnected };
}
