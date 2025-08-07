'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | null;
  currentRoom: string | null;
  joinRoom: (stakeAmount: number) => void;
  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  userId: null,
  currentRoom: null,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, userId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io({
      path: '/api/socketio',
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socketInstance.id);
      
      // Join user-specific room
      socketInstance.emit('join', { userId });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Handle room joining
    socketInstance.on('room-joined', ({ roomId, stakeAmount, timeLeft, status }) => {
      console.log(`Joined room ${roomId} for stake ${stakeAmount}`);
      setCurrentRoom(roomId);
      
      // Update timer state immediately when joining room
      const timerEvent = new CustomEvent('timer-update', { 
        detail: { timeLeft, roomId } 
      });
      window.dispatchEvent(timerEvent);
    });

    // Handle timer updates
    socketInstance.on('timer-update', ({ timeLeft, roomId }) => {
      console.log(`Timer update for room ${roomId}: ${timeLeft}s left`);
    });

    // Handle redirect to draw page
    socketInstance.on('redirect-to-draw', ({ roomId, stakeAmount, confirmedCartelas }) => {
      console.log(`Redirecting to draw page for room ${roomId}`);
      // Store draw data in sessionStorage for the draw page
      sessionStorage.setItem('drawData', JSON.stringify({
        roomId,
        stakeAmount,
        confirmedCartelas,
        timestamp: Date.now()
      }));
      
      // Redirect to draw page
      window.location.href = '/draw';
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  const joinRoom = (stakeAmount: number) => {
    console.log(`joinRoom called with stakeAmount: ${stakeAmount}, userId: ${userId}, isConnected: ${isConnected}`);
    if (socket && isConnected && userId) {
      console.log(`Emitting join-room event: stakeAmount=${stakeAmount}, userId=${userId}`);
      socket.emit('join-room', {
        stakeAmount,
        userId
      });
    } else {
      console.log(`Cannot join room - socket: ${!!socket}, isConnected: ${isConnected}, userId: ${userId}`);
    }
  };

  const leaveRoom = () => {
    if (socket && isConnected && currentRoom) {
      socket.emit('leave-room', {
        roomId: currentRoom,
        userId
      });
      setCurrentRoom(null);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    userId,
    currentRoom,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};