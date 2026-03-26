import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentRoomId: string | null = null;

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001/chat';

export const connectSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: {
      token: token || localStorage.getItem('token'),
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
    if (currentRoomId) {
      socket?.emit('join_room', { roomId: currentRoomId });
      console.log('Re-joined room:', currentRoomId);
    }
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('WebSocket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_failed', () => {
    console.error('WebSocket reconnection failed');
  });

  socket.on('error', (error: any) => {
    console.error('WebSocket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinRoom = (roomId: string) => {
  currentRoomId = roomId;
  socket?.emit('join_room', { roomId });
};

export const leaveRoom = (roomId: string) => {
  socket?.emit('leave_room', { roomId });
};

export const sendMessage = (roomId: string, content: string) => {
  socket?.emit('send_message', { roomId, content });
};
