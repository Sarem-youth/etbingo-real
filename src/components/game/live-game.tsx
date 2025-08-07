'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Circle, Trophy, Users, Clock } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/contexts/auth-context';

interface LiveGameProps {
  stakeAmount: number;
  confirmedCartelas: number[];
  onGameEnd: (won: boolean, amount: number) => void;
  onBack: () => void;
}

interface CalledBall {
  number: number;
  letter: string;
  timestamp: number;
}

interface BingoCard {
  id: number;
  numbers: number[][];
  marked: boolean[][];
  isWinner: boolean;
}

export function LiveGame({ 
  stakeAmount, 
  confirmedCartelas, 
  onGameEnd, 
  onBack 
}: LiveGameProps) {
  const { toast } = useToast();
  const { socket, isConnected, userId, currentRoom } = useSocket();
  const { user } = useAuth();
  const [calledBalls, setCalledBalls] = useState<CalledBall[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(60);
  const [playersCount, setPlayersCount] = useState(0);
  const [bingoCards, setBingoCards] = useState<BingoCard[]>([]);
  const [currentWinAmount, setCurrentWinAmount] = useState(0);
  const [hasBingo, setHasBingo] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected || !userId || !currentRoom) return;

    // Initialize bingo cards from confirmed cartelas
    const cards: BingoCard[] = confirmedCartelas.map(cartelaId => ({
      id: cartelaId,
      numbers: generateBingoCardNumbers(),
      marked: Array(5).fill(null).map(() => Array(5).fill(false)),
      isWinner: false
    }));
    setBingoCards(cards);

    // Listen for game start
    const handleGameStart = (data: { roomId: string; winAmount: number }) => {
      if (data.roomId === currentRoom) {
        setGameStatus('playing');
        setCurrentWinAmount(data.winAmount);
        toast({
          title: "Game Started!",
          description: `Good luck! Win amount: ${data.winAmount} ETB`,
        });
      }
    };

    // Listen for ball calls
    const handleBallCalled = (data: { number: number; letter: string; roomId: string }) => {
      if (data.roomId === currentRoom) {
        const newBall: CalledBall = {
          number: data.number,
          letter: data.letter,
          timestamp: Date.now()
        };
        
        setCalledBalls(prev => [...prev, newBall]);
        
        // Mark the number on all cards
        setBingoCards(prevCards => 
          prevCards.map(card => {
            const newMarked = card.marked.map((row, rowIndex) =>
              row.map((marked, colIndex) => 
                marked || card.numbers[rowIndex][colIndex] === data.number
              )
            );
            
            // Check for bingo after marking
            const isWinner = checkForBingo(newMarked);
            
            return {
              ...card,
              marked: newMarked,
              isWinner: isWinner
            };
          })
        );
      }
    };

    // Listen for game end
    const handleGameEnd = (data: { roomId: string; winnerId?: string; winnerName?: string }) => {
      if (data.roomId === currentRoom) {
        setGameStatus('finished');
        const isWinner = data.winnerId === userId;
        
        if (isWinner) {
          setHasBingo(true);
          toast({
            title: "🎉 BINGO! You Won!",
            description: `Congratulations! You won ${currentWinAmount} ETB`,
          });
        } else {
          toast({
            title: "Game Over",
            description: data.winnerName ? `${data.winnerName} won the game!` : "Game ended",
          });
        }
        
        onGameEnd(isWinner, isWinner ? currentWinAmount : 0);
      }
    };

    // Listen for players count
    const handlePlayersUpdate = (data: { roomId: string; count: number }) => {
      if (data.roomId === currentRoom) {
        setPlayersCount(data.count);
      }
    };

    // Listen for timer updates
    const handleTimerUpdate = (data: { timeLeft: number; roomId: string }) => {
      if (data.roomId === currentRoom) {
        setTimeLeft(data.timeLeft);
      }
    };

    socket.on('game-start', handleGameStart);
    socket.on('ball-called', handleBallCalled);
    socket.on('game-end', handleGameEnd);
    socket.on('players-update', handlePlayersUpdate);
    socket.on('timer-update', handleTimerUpdate);

    // Request initial game state
    socket.emit('get-game-state', { roomId: currentRoom });

    return () => {
      socket.off('game-start', handleGameStart);
      socket.off('ball-called', handleBallCalled);
      socket.off('game-end', handleGameEnd);
      socket.off('players-update', handlePlayersUpdate);
      socket.off('timer-update', handleTimerUpdate);
    };
  }, [socket, isConnected, userId, currentRoom, confirmedCartelas, currentWinAmount, onGameEnd]);

  const generateBingoCardNumbers = (): number[][] => {
    const card: number[][] = [];
    
    // B column: 1-15
    card[0] = generateRandomNumbers(1, 15, 5);
    // I column: 16-30
    card[1] = generateRandomNumbers(16, 30, 5);
    // N column: 31-45 (center is free)
    card[2] = generateRandomNumbers(31, 45, 5);
    card[2][2] = 0; // Free space in center
    // G column: 46-60
    card[3] = generateRandomNumbers(46, 60, 5);
    // O column: 61-75
    card[4] = generateRandomNumbers(61, 75, 5);

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

  const checkForBingo = (marked: boolean[][]): boolean => {
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

  const handleBingoCall = () => {
    if (!socket || !isConnected || !userId || !currentRoom) return;

    const winningCards = bingoCards.filter(card => card.isWinner);
    
    if (winningCards.length === 0) {
      toast({
        title: "No Bingo Yet",
        description: "You don't have a bingo pattern yet. Keep playing!",
        variant: "destructive",
      });
      return;
    }

    socket.emit('bingo-called', {
      userId: userId,
      roomId: currentRoom,
      cardIds: winningCards.map(card => card.id)
    });

    setHasBingo(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBingoLetter = (index: number) => {
    return ['B', 'I', 'N', 'G', 'O'][index];
  };

  const getNumberColor = (number: number, marked: boolean) => {
    if (marked) {
      return 'bg-green-500 text-white';
    }
    
    const isCalled = calledBalls.some(ball => ball.number === number);
    if (isCalled) {
      return 'bg-blue-500 text-white';
    }
    
    return 'bg-gray-100 hover:bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              disabled={gameStatus === 'playing'}
            >
              ← Leave Game
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-blue-300 mb-1">Time Remaining</div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-blue-300 mb-1">Players</div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg px-4 py-2">
                  <div className="text-xl font-bold text-white flex items-center justify-center">
                    <Users className="w-4 h-4 mr-1" />
                    {playersCount}
                  </div>
                </div>
              </div>
              
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">
              {gameStatus === 'waiting' ? 'Waiting for Game to Start' : 
               gameStatus === 'playing' ? '🎮 Live Bingo Game' : 
               '🎉 Game Finished'}
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              {gameStatus === 'waiting' ? 'Get ready! The game will start soon...' :
               gameStatus === 'playing' ? 'Mark your numbers and call BINGO when you win!' :
               hasBingo ? 'Congratulations! You won!' : 'Better luck next time!'}
            </p>
          </div>

          {/* Win Amount Display */}
          {gameStatus !== 'waiting' && (
            <div className="flex justify-center mb-8">
              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-8 h-8" />
                    <div>
                      <div className="text-sm opacity-90">Prize Pool</div>
                      <div className="text-3xl font-bold">{currentWinAmount} ETB</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Called Balls */}
          <Card className="bg-white border-0 shadow-2xl overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
              <CardTitle className="text-xl font-semibold text-center">
                Called Numbers ({calledBalls.length}/75)
              </CardTitle>
              <p className="text-blue-100 text-center text-sm">
                Numbers that have been called in this game
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-2 max-h-40 overflow-y-auto">
                {calledBalls.map((ball, index) => (
                  <div
                    key={index}
                    className="w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-400"
                  >
                    <div className="text-center">
                      <div className="text-xs">{ball.letter}</div>
                      <div>{ball.number}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bingo Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Your Bingo Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bingoCards.map((card) => (
                <Card 
                  key={card.id} 
                  className={`bg-white border-0 shadow-2xl overflow-hidden transform transition-all duration-300 ${
                    card.isWinner ? 'ring-4 ring-yellow-400 scale-105' : ''
                  }`}
                >
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
                    <CardTitle className="text-lg font-bold text-center">
                      Cartela No. {card.id}
                      {card.isWinner && (
                        <Badge className="ml-2 bg-yellow-500 text-yellow-900">
                          🎉 BINGO!
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* BINGO Header */}
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      {['B', 'I', 'N', 'G', 'O'].map((letter, index) => {
                        const colors = {
                          'B': '#ef4444',
                          'I': '#f97316', 
                          'N': '#eab308',
                          'G': '#22c55e',
                          'O': '#3b82f6'
                        };
                        return (
                          <div 
                            key={letter} 
                            className="text-center font-bold text-sm p-2 rounded-t-lg"
                            style={{ backgroundColor: colors[letter as keyof typeof colors] }}
                          >
                            <span className="text-white font-bold">{letter}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Bingo Numbers Grid */}
                    <div className="grid grid-cols-5 gap-1">
                      {card.numbers.map((column, colIndex) => (
                        column.map((number, rowIndex) => (
                          <div
                            key={`${colIndex}-${rowIndex}`}
                            className={`
                              w-full aspect-square rounded flex items-center justify-center text-sm font-bold
                              ${number === 0 ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' : 
                                getNumberColor(number, card.marked[rowIndex][colIndex])}
                              transition-all duration-200 border
                              ${number === 0 ? 'border-green-400' : 'border-gray-200'}
                              hover:shadow-md
                            `}
                          >
                            {number === 0 ? (
                              <div className="text-center">
                                <div className="text-xs">FREE</div>
                              </div>
                            ) : (
                              number
                            )}
                          </div>
                        ))
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bingo Button */}
          {gameStatus === 'playing' && (
            <div className="flex justify-center mb-8">
              <Button
                onClick={handleBingoCall}
                disabled={hasBingo}
                className={`px-12 py-4 text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
                  hasBingo 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse'
                }`}
              >
                {hasBingo ? '✓ BINGO Called!' : '🎯 CALL BINGO!'}
              </Button>
            </div>
          )}

          {/* Game Instructions */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">How to Play</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                  <span>Watch for called numbers and mark them on your cards</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                  <span>Get 5 in a row (horizontal, vertical, or diagonal) to win</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                  <span>Click "CALL BINGO!" when you have a winning pattern</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">4</div>
                  <span>First player to call bingo wins the prize!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}