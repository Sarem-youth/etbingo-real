'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Square, Clock, Users, Award } from 'lucide-react';

interface DrawData {
  roomId: string;
  stakeAmount: number;
  confirmedCartelas: number[];
  timestamp: number;
}

interface BingoCard {
  id: number;
  numbers: number[][];
  isDaubed: boolean[][];
}

export default function DrawPage() {
  const { user, isLoading } = useAuth();
  const { socket, isConnected, currentRoom } = useSocket();
  const { toast } = useToast();
  const [drawData, setDrawData] = useState<DrawData | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [bingoCards, setBingoCards] = useState<BingoCard[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'drawing' | 'finished'>('waiting');
  const [winners, setWinners] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has access to this page
    const storedDrawData = sessionStorage.getItem('drawData');
    if (!storedDrawData) {
      // Redirect to home if no draw data
      window.location.href = '/';
      return;
    }

    try {
      const data: DrawData = JSON.parse(storedDrawData);
      setDrawData(data);
      
      // Check if data is recent (within 5 minutes)
      const now = Date.now();
      if (now - data.timestamp > 5 * 60 * 1000) {
        toast({
          title: "Session Expired",
          description: "Your game session has expired. Please join a new game.",
          variant: "destructive",
        });
        sessionStorage.removeItem('drawData');
        window.location.href = '/';
        return;
      }

      // Generate bingo cards for confirmed cartelas
      const cards: BingoCard[] = data.confirmedCartelas.map(cartelaNumber => ({
        id: cartelaNumber,
        numbers: generateBingoCardNumbers(),
        isDaubed: Array(5).fill(null).map(() => Array(5).fill(false))
      }));
      setBingoCards(cards);

    } catch (error) {
      console.error('Error parsing draw data:', error);
      window.location.href = '/';
    }
  }, [toast]);

  useEffect(() => {
    if (!socket || !isConnected || !drawData) return;

    // Join the draw room
    socket.emit('join', { userId: user?.id, roomId: drawData.roomId });

    // Listen for number calling
    const handleNumberCalled = (data: { number: number; roomId: string }) => {
      if (data.roomId === drawData.roomId) {
        setCalledNumbers(prev => [...prev, data.number]);
        
        // Auto-daub the number on all cards
        setBingoCards(prevCards => 
          prevCards.map(card => ({
            ...card,
            isDaubed: card.isDaubed.map((row, rowIndex) =>
              row.map((cell, colIndex) =>
                cell || card.numbers[rowIndex][colIndex] === data.number
              )
            )
          }))
        );
      }
    };

    // Listen for game status updates
    const handleGameStatus = (data: { status: string; roomId: string }) => {
      if (data.roomId === drawData.roomId) {
        setGameStatus(data.status as 'waiting' | 'drawing' | 'finished');
      }
    };

    // Listen for timer updates
    const handleTimerUpdate = (data: { timeLeft: number; roomId: string }) => {
      if (data.roomId === drawData.roomId) {
        setTimeLeft(data.timeLeft);
      }
    };

    // Listen for winners
    const handleWinner = (data: { userId: string; cartelaNumber: number; roomId: string }) => {
      if (data.roomId === drawData.roomId) {
        setWinners(prev => [...prev, data.userId]);
        
        if (data.userId === user?.id) {
          toast({
            title: "BINGO! You Won!",
            description: `Congratulations! Your cartela ${data.cartelaNumber} won!`,
            variant: "default",
          });
        }
      }
    };

    socket.on('number-called', handleNumberCalled);
    socket.on('game-status', handleGameStatus);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('winner', handleWinner);

    return () => {
      socket.off('number-called', handleNumberCalled);
      socket.off('game-status', handleGameStatus);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('winner', handleWinner);
    };
  }, [socket, isConnected, drawData, user?.id, toast]);

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
    return numbers;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkBingo = (card: BingoCard): boolean => {
    // Check rows
    for (let row = 0; row < 5; row++) {
      if (card.isDaubed[row].every(cell => cell)) return true;
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card.isDaubed.every(row => row[col])) return true;
    }
    
    // Check diagonals
    if (card.isDaubed[0][0] && card.isDaubed[1][1] && card.isDaubed[2][2] && card.isDaubed[3][3] && card.isDaubed[4][4]) return true;
    if (card.isDaubed[0][4] && card.isDaubed[1][3] && card.isDaubed[2][2] && card.isDaubed[3][1] && card.isDaubed[4][0]) return true;
    
    return false;
  };

  const handleBingoCall = (card: BingoCard) => {
    if (checkBingo(card) && socket && isConnected && drawData && user?.id) {
      socket.emit('bingo-call', {
        userId: user.id,
        cartelaNumber: card.id,
        roomId: drawData.roomId
      });
    } else {
      toast({
        title: "No Bingo Yet",
        description: "You don't have a bingo yet. Keep playing!",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGame = () => {
    sessionStorage.removeItem('drawData');
    window.location.href = '/';
  };

  if (isLoading || !user || !drawData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <Navigation currentPage="draw" />
      
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* Game Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-600 text-white text-lg px-4 py-2 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </Badge>
              
              <Badge className="bg-purple-600 text-white text-lg px-4 py-2 flex items-center">
                <Square className="w-4 h-4 mr-2" />
                {drawData.stakeAmount} ETB
              </Badge>

              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>

            <Button 
              variant="outline" 
              onClick={handleLeaveGame}
              className="text-white border-white hover:bg-white hover:text-blue-900"
            >
              Leave Game
            </Button>
          </div>

          {/* Game Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Bingo Draw Room
            </h1>
            <p className="text-blue-200">
              Room: {drawData.roomId} | Your Cartelas: {drawData.confirmedCartelas.length}
            </p>
          </div>

          {/* Called Numbers */}
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-center text-blue-900">
                Called Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
                {calledNumbers.length === 0 ? (
                  <div className="text-gray-500 text-center w-full">
                    No numbers called yet. Game starting soon...
                  </div>
                ) : (
                  calledNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm"
                    >
                      {number}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bingo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {bingoCards.map((card) => (
              <Card key={card.id} className="bg-white">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-bold text-blue-900">
                    Cartela No.{card.id}
                  </CardTitle>
                  {checkBingo(card) && (
                    <Badge className="bg-yellow-500 text-yellow-900">
                      BINGO!
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-3">
                  {/* BINGO Header */}
                  <div className="grid grid-cols-5 gap-1 mb-2">
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
                          className="text-center font-bold text-sm p-1 rounded"
                          style={{ backgroundColor: colors[letter as keyof typeof colors] }}
                        >
                          <span className="text-white">{letter}</span>
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
                            w-full aspect-square rounded flex items-center justify-center text-xs font-bold
                            ${number === 0 ? 'bg-green-500 text-white' : 
                              card.isDaubed[rowIndex][colIndex] ? 'bg-blue-500 text-white' : 
                              'bg-gray-100 hover:bg-gray-200'}
                            transition-colors
                          `}
                        >
                          {number === 0 ? 'FREE' : number}
                        </div>
                      ))
                    ))}
                  </div>

                  {/* Bingo Button */}
                  <Button
                    onClick={() => handleBingoCall(card)}
                    className="w-full mt-3 bg-red-600 hover:bg-red-700"
                    disabled={!checkBingo(card)}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    BINGO!
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Winners Section */}
          {winners.length > 0 && (
            <Card className="bg-yellow-100 border-yellow-400">
              <CardHeader>
                <CardTitle className="text-center text-yellow-900">
                  🎉 Winners 🎉
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-yellow-800 font-semibold">
                    {winners.length} winner{winners.length > 1 ? 's' : ''} declared!
                  </p>
                  {winners.includes(user?.id || '') && (
                    <p className="text-yellow-700 mt-2">
                      🎊 Congratulations! You are a winner! 🎊
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Status */}
          <Card className="bg-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-semibold">
                    Status: {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
                  </span>
                </div>
                <div className="text-blue-600 text-sm">
                  Connected Players: {drawData.confirmedCartelas.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}