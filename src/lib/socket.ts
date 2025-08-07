import { Server } from 'socket.io';

// Cartela status types
export type CartelaStatus = 'available' | 'selected-by-other' | 'confirmed-by-other' | 'confirmed-by-self';

// Room management
interface GameRoom {
  id: string;
  stakeAmount: number;
  status: 'waiting' | 'selection' | 'drawing' | 'finished';
  timeLeft: number;
  users: string[];
  confirmedCartelas: { [userId: string]: number[] };
  createdAt: Date;
  expiresAt: Date;
}

// Store cartela status in memory (in production, this would be in Redis or database)
const cartelaStatus = new Map<number, { status: CartelaStatus; userId: string; }>();

// Store active rooms
const activeRooms = new Map<string, GameRoom>();

// Track active timers to prevent duplicates
const activeTimers = new Map<string, NodeJS.Timeout>();

export const setupSocket = (io: Server) => {
  // Clear any existing rooms and timers on server start
  activeRooms.clear();
  activeTimers.clear();
  console.log('Cleared existing rooms and timers on server start');
  
  // Start automatic room creation cycle (every 60 seconds)
  const startRoomCreationCycle = () => {
    console.log('Starting automatic room creation cycle');
    
    // Create initial rooms for all stake amounts
    const stakeAmounts = [10, 20, 50, 100, 200, 300];
    stakeAmounts.forEach(stakeAmount => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 1000);
      
      const room: GameRoom = {
        id: `room_${stakeAmount}_${Date.now()}`,
        stakeAmount,
        status: 'selection',
        timeLeft: 60,
        users: [],
        confirmedCartelas: {},
        createdAt: now,
        expiresAt,
      };
      
      activeRooms.set(room.id, room);
      console.log(`Created initial room ${room.id} for stake ${stakeAmount}`);
      
      // Start timer for this room
      startRoomTimer(room.id, io);
    });
    
    // Set up recurring room creation every 60 seconds
    setInterval(() => {
      const now = new Date();
      stakeAmounts.forEach(stakeAmount => {
        const expiresAt = new Date(now.getTime() + 60 * 1000);
        
        const room: GameRoom = {
          id: `room_${stakeAmount}_${Date.now()}`,
          stakeAmount,
          status: 'selection',
          timeLeft: 60,
          users: [],
          confirmedCartelas: {},
          createdAt: now,
          expiresAt,
        };
        
        activeRooms.set(room.id, room);
        console.log(`Created new room ${room.id} for stake ${stakeAmount}`);
        
        // Start timer for this room
        startRoomTimer(room.id, io);
      });
    }, 60000); // Every 60 seconds
  };
  
  // Start the room creation cycle
  startRoomCreationCycle();
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user joining
    socket.on('join', ({ userId, roomId }: { userId: string; roomId?: string }) => {
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      
      if (roomId) {
        socket.join(`room:${roomId}`);
        console.log(`User ${userId} joined room ${roomId} with socket ${socket.id}`);
        
        // Add user to room
        const room = activeRooms.get(roomId);
        if (room && !room.users.includes(userId)) {
          room.users.push(userId);
          activeRooms.set(roomId, room);
        }
      } else {
        console.log(`User ${userId} joined with socket ${socket.id}`);
      }
    });

    // Handle room creation and joining
    socket.on('join-room', ({ stakeAmount, userId }: { stakeAmount: number; userId: string }) => {
      console.log(`join-room event received: stakeAmount=${stakeAmount}, userId=${userId}`);
      
      // Clean up expired rooms first
      const now = new Date();
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.expiresAt < now || room.timeLeft <= 0) {
          console.log(`Cleaning up expired room ${roomId}`);
          activeRooms.delete(roomId);
          if (activeTimers.has(roomId)) {
            clearInterval(activeTimers.get(roomId));
            activeTimers.delete(roomId);
          }
        }
      }

      // Find the most recent active room for this stake amount
      const roomsForStake = Array.from(activeRooms.values())
        .filter(r => r.stakeAmount === stakeAmount && r.status === 'selection' && r.timeLeft > 0)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      let room = roomsForStake[0]; // Get the most recent room
      
      if (!room) {
        // If no room exists, create one immediately
        const expiresAt = new Date(now.getTime() + 60 * 1000);
        
        room = {
          id: `room_${stakeAmount}_${Date.now()}`,
          stakeAmount,
          status: 'selection',
          timeLeft: 60,
          users: [userId],
          confirmedCartelas: {},
          createdAt: now,
          expiresAt,
        };
        
        activeRooms.set(room.id, room);
        console.log(`Created immediate room ${room.id} for stake ${stakeAmount}`);
      } else {
        console.log(`Found existing room ${room.id} for stake ${stakeAmount}, status: ${room.status}, timeLeft: ${room.timeLeft}`);
      }

      // Join the room
      socket.join(`room:${room.id}`);
      socket.data.roomId = room.id;
      
      if (!room.users.includes(userId)) {
        room.users.push(userId);
        activeRooms.set(room.id, room);
      }

      // Send room info to user
      socket.emit('room-joined', {
        roomId: room.id,
        stakeAmount: room.stakeAmount,
        timeLeft: room.timeLeft,
        status: room.status
      });

      // Start universal timer for this room if not already started
      console.log(`Attempting to start timer for room ${room.id}, status: ${room.status}, timeLeft: ${room.timeLeft}`);
      if (room.status === 'selection' && room.timeLeft > 0) {
        startRoomTimer(room.id, io);
      } else {
        console.log(`Timer not started - status: ${room.status}, timeLeft: ${room.timeLeft}`);
      }
    });

    // Handle cartela selection (when user clicks on a cartela)
    socket.on('cartela-selected', ({ cartelaNumber, userId, roomId }: { cartelaNumber: number; userId: string; roomId: string }) => {
      console.log(`Cartela ${cartelaNumber} selected by user ${userId} in room ${roomId}`);
      
      // Update cartela status
      cartelaStatus.set(cartelaNumber, {
        status: 'selected-by-other',
        userId: userId
      });

      // Broadcast to all other users in the room that this cartela is selected
      socket.to(`room:${roomId}`).emit('cartela-status-changed', {
        cartelaNumber,
        status: 'selected-by-other' as CartelaStatus,
        userId
      });
    });

    // Handle cartela confirmation (when user confirms a cartela)
    socket.on('cartela-confirmed', ({ cartelaNumber, userId, roomId }: { cartelaNumber: number; userId: string; roomId: string }) => {
      console.log(`Cartela ${cartelaNumber} confirmed by user ${userId} in room ${roomId}`);
      
      // Update cartela status
      cartelaStatus.set(cartelaNumber, {
        status: 'confirmed-by-other',
        userId: userId
      });

      // Update room's confirmed cartelas
      const room = activeRooms.get(roomId);
      if (room) {
        if (!room.confirmedCartelas[userId]) {
          room.confirmedCartelas[userId] = [];
        }
        room.confirmedCartelas[userId].push(cartelaNumber);
        activeRooms.set(roomId, room);
      }

      // Broadcast to all other users in the room that this cartela is confirmed
      socket.to(`room:${roomId}`).emit('cartela-status-changed', {
        cartelaNumber,
        status: 'confirmed-by-other' as CartelaStatus,
        userId
      });

      // Send confirmation back to the user who confirmed it (for their own green highlighting)
      socket.emit('cartela-own-confirmed', {
        cartelaNumber,
        status: 'confirmed-by-self' as CartelaStatus
      });
    });

    // Handle cartela deselection (when user goes back from confirmation page)
    socket.on('cartela-deselected', ({ cartelaNumber, userId, roomId }: { cartelaNumber: number; userId: string; roomId: string }) => {
      console.log(`Cartela ${cartelaNumber} deselected by user ${userId} in room ${roomId}`);
      
      // Remove cartela status or revert to available
      const currentStatus = cartelaStatus.get(cartelaNumber);
      if (currentStatus && currentStatus.userId === userId) {
        cartelaStatus.delete(cartelaNumber);
        
        // Broadcast to all users in the room that this cartela is available again
        io.to(`room:${roomId}`).emit('cartela-status-changed', {
          cartelaNumber,
          status: 'available' as CartelaStatus,
          userId: null
        });
      }
    });

    // Handle getting current cartela statuses
    socket.on('get-cartela-statuses', ({ roomId }: { roomId: string }) => {
      const statuses: Array<{ cartelaNumber: number; status: CartelaStatus; userId: string | null }> = [];
      
      cartelaStatus.forEach((value, key) => {
        statuses.push({
          cartelaNumber: key,
          status: value.status,
          userId: value.userId
        });
      });

      socket.emit('cartela-statuses', statuses);
    });

    // Handle bingo calls
    socket.on('bingo-called', ({ userId, roomId, cardIds }: { userId: string; roomId: string; cardIds: number[] }) => {
      console.log(`Bingo called by user ${userId} with cards ${cardIds.join(', ')} in room ${roomId}`);
      
      // Validate the bingo call (simplified for demo)
      const room = activeRooms.get(roomId);
      if (room && room.status === 'drawing') {
        // For demo purposes, accept the bingo call
        clearInterval(getActiveTimer(roomId));
        
        // Broadcast winner to all users in the room
        io.to(`room:${roomId}`).emit('game-end', {
          roomId: roomId,
          winnerId: userId,
          winnerName: `Player ${userId.slice(0, 8)}`
        });

        // Update room status
        room.status = 'finished';
        activeRooms.set(roomId, room);
        
        console.log(`Bingo validated for user ${userId} in room ${roomId}`);
      } else {
        // Invalid bingo call
        socket.emit('bingo-invalid', {
          message: 'Invalid bingo call or game not in progress'
        });
      }
    });

    // Handle getting game state
    socket.on('get-game-state', ({ roomId }: { roomId: string }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        socket.emit('game-state', {
          roomId: roomId,
          status: room.status,
          timeLeft: room.timeLeft,
          stakeAmount: room.stakeAmount,
          playersCount: room.users.length
        });
      }
    });

    // Handle messages (keep existing functionality)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      
      // Clean up any cartela selections by this user
      if (userId) {
        const toRemove: number[] = [];
        cartelaStatus.forEach((value, key) => {
          if (value.userId === userId) {
            toRemove.push(key);
          }
        });
        
        toRemove.forEach(cartelaNumber => {
          cartelaStatus.delete(cartelaNumber);
          // Broadcast that these cartelas are now available
          if (roomId) {
            io.to(`room:${roomId}`).emit('cartela-status-changed', {
              cartelaNumber,
              status: 'available' as CartelaStatus,
              userId: null
            });
          }
        });
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Ethio Bingo WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Universal timer function for rooms
const startRoomTimer = (roomId: string, io: Server) => {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'selection') return;

  // Check if timer already exists for this room
  if (activeTimers.has(roomId)) {
    console.log(`Timer already exists for room ${roomId}`);
    return;
  }

  console.log(`Starting timer for room ${roomId} with ${room.timeLeft}s left`);

  const timerInterval = setInterval(() => {
    const currentRoom = activeRooms.get(roomId);
    if (!currentRoom) {
      clearInterval(timerInterval);
      activeTimers.delete(roomId);
      return;
    }

    currentRoom.timeLeft -= 1;
    activeRooms.set(roomId, currentRoom);

    // Broadcast timer update to all users in the room
    io.to(`room:${roomId}`).emit('timer-update', {
      timeLeft: currentRoom.timeLeft,
      roomId: roomId
    });

    console.log(`Timer update for room ${roomId}: ${currentRoom.timeLeft}s left`);

    // When timer expires
    if (currentRoom.timeLeft <= 0) {
      clearInterval(timerInterval);
      activeTimers.delete(roomId);
      
      // Update room status
      currentRoom.status = 'drawing';
      activeRooms.set(roomId, currentRoom);

      // Redirect all users with confirmed cartelas to draw page
      const usersWithCartelas = Object.keys(currentRoom.confirmedCartelas).filter(userId => 
        currentRoom.confirmedCartelas[userId].length > 0
      );

      usersWithCartelas.forEach(userId => {
        io.to(`user:${userId}`).emit('redirect-to-draw', {
          roomId: roomId,
          stakeAmount: currentRoom.stakeAmount,
          confirmedCartelas: currentRoom.confirmedCartelas[userId]
        });
      });

      // Create new room for new users immediately
      const now = new Date();
      const newRoom: GameRoom = {
        id: `room_${currentRoom.stakeAmount}_${Date.now()}`,
        stakeAmount: currentRoom.stakeAmount,
        status: 'selection',
        timeLeft: 60,
        users: [],
        confirmedCartelas: {},
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60 * 1000),
      };
      
      activeRooms.set(newRoom.id, newRoom);
      console.log(`Created replacement room ${newRoom.id} for stake ${currentRoom.stakeAmount}`);
      
      // Start timer for the replacement room
      startRoomTimer(newRoom.id, io);

      // Start number calling for the drawing room
      startNumberCalling(roomId, io);
    }
  }, 1000);

  // Store the timer reference
  activeTimers.set(roomId, timerInterval);
};

// Number calling system for draw rooms
const startNumberCalling = (roomId: string, io: Server) => {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'drawing') return;

  const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
  const calledNumbers: number[] = [];

  // Start the game
  io.to(`room:${roomId}`).emit('game-start', {
    roomId: roomId,
    winAmount: room.stakeAmount * 25 // 25x multiplier for wins
  });

  const callInterval = setInterval(() => {
    const currentRoom = activeRooms.get(roomId);
    if (!currentRoom || currentRoom.status !== 'drawing') {
      clearInterval(callInterval);
      return;
    }

    if (availableNumbers.length === 0) {
      clearInterval(callInterval);
      io.to(`room:${roomId}`).emit('game-end', {
        roomId: roomId,
        winnerId: null,
        winnerName: null
      });
      return;
    }

    // Call a random number
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const calledNumber = availableNumbers.splice(randomIndex, 1)[0];
    calledNumbers.push(calledNumber);

    // Determine the letter (B-I-N-G-O)
    const letter = getBingoLetter(calledNumber);

    // Broadcast the called number to all users in the room
    io.to(`room:${roomId}`).emit('ball-called', {
      number: calledNumber,
      letter: letter,
      roomId: roomId
    });

    console.log(`Called ball ${letter}-${calledNumber} in room ${roomId}`);

    // Check for potential winners after each call
    setTimeout(async () => {
      await checkForWinners(roomId, io, calledNumbers);
    }, 500);

  }, 3000); // Call a number every 3 seconds
};

// Helper function to get bingo letter
const getBingoLetter = (number: number): string => {
  if (number <= 15) return 'B';
  if (number <= 30) return 'I';
  if (number <= 45) return 'N';
  if (number <= 60) return 'G';
  return 'O';
};



// Helper function to get active timer
const getActiveTimer = (roomId: string): NodeJS.Timeout | undefined => {
  return activeTimers.get(roomId);
};

// Bingo pattern validation
interface BingoCard {
  id: number;
  numbers: number[][];
  marked: boolean[][];
}

// Check if a card has a bingo pattern
const checkBingoPattern = (card: BingoCard, calledNumbers: number[]): boolean => {
  const marked = card.marked.map((row, rowIndex) =>
    row.map((marked, colIndex) => 
      marked || calledNumbers.includes(card.numbers[rowIndex][colIndex])
    )
  );

  // Check rows
  for (let row = 0; row < 5; row++) {
    if (marked[row].every(cell => cell || (row === 2 && marked[row][2] === false))) {
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    if (marked.every(row => row[col] || (col === 2 && row[2] === false))) {
      return true;
    }
  }

  // Check diagonals
  const diagonal1 = marked.every((row, index) => row[index] || (index === 2));
  const diagonal2 = marked.every((row, index) => row[4 - index] || (index === 2));

  return diagonal1 || diagonal2;
};

// Generate a bingo card for validation
const generateBingoCard = (cardId: number): BingoCard => {
  const card: BingoCard = {
    id: cardId,
    numbers: [],
    marked: Array(5).fill(null).map(() => Array(5).fill(false))
  };

  // B column: 1-15
  card.numbers[0] = generateRandomNumbers(1, 15, 5);
  // I column: 16-30
  card.numbers[1] = generateRandomNumbers(16, 30, 5);
  // N column: 31-45 (center is free)
  card.numbers[2] = generateRandomNumbers(31, 45, 5);
  card.numbers[2][2] = 0; // Free space in center
  // G column: 46-60
  card.numbers[3] = generateRandomNumbers(46, 60, 5);
  // O column: 61-75
  card.numbers[4] = generateRandomNumbers(61, 75, 5);

  return card;
};

const generateRandomNumbers = (min: number, max: number, count: number): number[] => {
  const numbers: number[] = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
};

// Enhanced winner checking with proper validation
const checkForWinners = async (roomId: string, io: Server, calledNumbers: number[]) => {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const usersWithCartelas = Object.keys(room.confirmedCartelas);
  
  // Check each user's cartelas for bingo patterns
  for (const userId of usersWithCartelas) {
    const userCartelas = room.confirmedCartelas[userId];
    
    for (const cartelaId of userCartelas) {
      // Generate the bingo card for validation
      const card = generateBingoCard(cartelaId);
      
      // Check if this card has a bingo pattern
      if (checkBingoPattern(card, calledNumbers)) {
        // Winner found!
        clearInterval(getActiveTimer(roomId));
        
        // Calculate win amount (25x stake)
        const winAmount = room.stakeAmount * 25;
        
        // Process automatic payout
        try {
          // In a real implementation, this would call the payout API
          // For now, we'll simulate the payout
          console.log(`Processing payout of ${winAmount} ETB to user ${userId}`);
          
          // Broadcast winner to all users in the room
          io.to(`room:${roomId}`).emit('game-end', {
            roomId: roomId,
            winnerId: userId,
            winnerName: `Player ${userId.slice(0, 8)}`,
            winningCardId: cartelaId,
            winAmount: winAmount
          });

          // Send payout confirmation to the winner
          io.to(`user:${userId}`).emit('payout-processed', {
            success: true,
            amount: winAmount,
            roomId: roomId,
            winningCardId: cartelaId,
            message: `Congratulations! You won ${winAmount} ETB!`
          });

          // Update room status
          room.status = 'finished';
          activeRooms.set(roomId, room);
          
          console.log(`Bingo detected and payout processed for user ${userId} with card ${cartelaId} in room ${roomId}`);
          return; // Exit after first winner
        } catch (error) {
          console.error('Error processing payout:', error);
          
          // Still end the game but notify about payout error
          io.to(`room:${roomId}`).emit('game-end', {
            roomId: roomId,
            winnerId: userId,
            winnerName: `Player ${userId.slice(0, 8)}`,
            winningCardId: cartelaId,
            winAmount: winAmount,
            payoutError: true
          });

          room.status = 'finished';
          activeRooms.set(roomId, room);
          return;
        }
      }
    }
  }
};