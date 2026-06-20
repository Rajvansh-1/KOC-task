import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const socket: Socket = io(URL, {
  autoConnect: false,
  withCredentials: true, // Crucial for WsJwtGuard to read the cookie
});
