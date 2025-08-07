'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameRoom {
  id: string;
  stakeAmount: number;
  status: 'waiting' | 'selection' | 'confirming' | 'drawing' | 'finished';
  timeLeft: number;
  users: string[];
  confirmedCartelas: { [userId: string]: number[] };
  createdAt: Date;
  expiresAt: Date;
}

interface RoomContextType {
  currentRoom: GameRoom | null;
  joinRoom: (stakeAmount: number) => void;
  leaveRoom: () => void;
  updateTimer: (timeLeft: number) => void;
  confirmCartela: (userId: string, cartelaNumber: number) => void;
  isTimerExpired: boolean;
}

const RoomContext = createContext<RoomContextType>({
  currentRoom: null,
  joinRoom: () => {},
  leaveRoom: () => {},
  updateTimer: () => {},
  confirmCartela: () => {},
  isTimerExpired: false,
});

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: React.ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  const joinRoom = (stakeAmount: number) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds from now
    
    const newRoom: GameRoom = {
      id: `room_${stakeAmount}_${Date.now()}`,
      stakeAmount,
      status: 'selection',
      timeLeft: 60,
      users: [],
      confirmedCartelas: {},
      createdAt: now,
      expiresAt,
    };
    
    setCurrentRoom(newRoom);
    setIsTimerExpired(false);
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setIsTimerExpired(false);
  };

  const updateTimer = (timeLeft: number) => {
    if (currentRoom) {
      const updatedRoom = {
        ...currentRoom,
        timeLeft,
        status: timeLeft > 0 ? 'selection' : 'drawing'
      };
      setCurrentRoom(updatedRoom);
      
      if (timeLeft <= 0) {
        setIsTimerExpired(true);
      }
    }
  };

  const confirmCartela = (userId: string, cartelaNumber: number) => {
    if (currentRoom) {
      const updatedConfirmedCartelas = {
        ...currentRoom.confirmedCartelas,
        [userId]: [...(currentRoom.confirmedCartelas[userId] || []), cartelaNumber]
      };
      
      setCurrentRoom({
        ...currentRoom,
        confirmedCartelas: updatedConfirmedCartelas
      });
    }
  };

  // Auto-expire timer when room expires
  useEffect(() => {
    if (!currentRoom) return;

    const checkExpiration = setInterval(() => {
      const now = new Date();
      if (now >= currentRoom.expiresAt) {
        setIsTimerExpired(true);
        setCurrentRoom({
          ...currentRoom,
          status: 'drawing',
          timeLeft: 0
        });
      }
    }, 1000);

    return () => clearInterval(checkExpiration);
  }, [currentRoom]);

  const value: RoomContextType = {
    currentRoom,
    joinRoom,
    leaveRoom,
    updateTimer,
    confirmCartela,
    isTimerExpired
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};