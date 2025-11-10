import { io, Socket } from 'socket.io-client';
import secureStorage from '../utils/secureStorage';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  const token = await secureStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  socket = io(apiUrl, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // Connected
  });
  socket.on('disconnect', () => {
    // Disconnected
  });
  socket.on('connect_error', () => {
    // Connection error
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
