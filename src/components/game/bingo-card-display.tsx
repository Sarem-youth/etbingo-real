'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Square, Clock } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/contexts/auth-context';

interface BingoCardDisplayProps {
  stakeAmount: number;
  selectedNumbers: number[];
  cardNumber: number;
  onCardsConfirmed: (selectedCards: number[]) => void;
  onBack: () => void;
}

interface BingoCard {
  id: number;
  numbers: number[][];
  isSelected: boolean;
}

export function BingoCardDisplay({ 
  stakeAmount, 
  selectedNumbers, 
  cardNumber,
  onCardsConfirmed, 
  onBack 
}: BingoCardDisplayProps) {
  const { toast } = useToast();
  const { socket, isConnected, userId, currentRoom } = useSocket();
  const { user, updateUserBalance } = useAuth();
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  
  // Use universal synchronized timer (same as main page and number selection)
  const [universalTimeLeft, setUniversalTimeLeft] = useState(60);

  // Universal synchronized timer (same logic as main page and number selection)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const secondsInCycle = 60;
      const currentSecond = Math.floor(now / 1000) % secondsInCycle;
      return secondsInCycle - currentSecond;
    };

    const updateTimer = () => {
      const timeLeft = calculateTimeLeft();
      setUniversalTimeLeft(timeLeft);
      
      // Auto-redirect when timer expires
      if (timeLeft <= 0) {
        handleConfirmCards();
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const timerInterval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // Generate only the specific cartela card that was selected
    const card: BingoCard = {
      id: cardNumber,
      numbers: generateBingoCardNumbers(),
      isSelected: true, // Always selected since they chose this specific card
    };
    setCards([card]);
    setSelectedCards([cardNumber]); // Always selected

    // Note: We no longer listen to socket timer updates since we use universal timer
  }, [cardNumber]);

  const generateBingoCardNumbers = (): number[][] => {
    // Generate a 5x5 bingo card with B-I-N-G-O columns
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

  const handleConfirmCards = async () => {
    // Check if user can afford this cartela (double-check)
    if (user && user.balance < stakeAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${stakeAmount} ETB to confirm this cartela, but you only have ${user.balance} ETB.`,
        variant: "destructive",
      });
      return;
    }

    // Deduct balance immediately
    if (user) {
      const newBalance = user.balance - stakeAmount;
      updateUserBalance(newBalance);
      
      toast({
        title: "Balance Deducted",
        description: `${stakeAmount} ETB has been deducted from your balance.`,
      });
    }

    // Emit cartela confirmation event
    if (socket && isConnected && userId && currentRoom) {
      socket.emit('cartela-confirmed', {
        cartelaNumber: cardNumber,
        userId: userId,
        roomId: currentRoom
      });
    }

    toast({
      title: "Cartela Confirmed",
      description: `Cartela No.${cardNumber} has been added to your selection.`,
    });
    
    // Call the parent handler to update confirmed cartelas
    onCardsConfirmed([cardNumber]);
  };

  const handleBack = () => {
    // Emit cartela deselection event
    if (socket && isConnected && userId && currentRoom) {
      socket.emit('cartela-deselected', {
        cartelaNumber: cardNumber,
        userId: userId,
        roomId: currentRoom
      });
    }
    
    onBack();
  };

  const getBingoLetter = (index: number) => {
    return ['B', 'I', 'N', 'G', 'O'][index];
  };

  const getNumberColor = (number: number, cardId: number) => {
    // Special case for the "F" marked cell in card 11 (as shown in screenshot)
    if (cardId === 11 && number === 31) {
      return 'bg-red-500 text-white';
    }
    
    // Highlight selected numbers
    if (selectedNumbers.includes(number)) {
      return 'bg-yellow-400 text-yellow-900';
    }
    
    return 'bg-gray-100 hover:bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              ← Back to Selection
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-blue-300 mb-1">Time Remaining</div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatTime(universalTimeLeft)}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-blue-300 mb-1">Cartela Cost</div>
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg px-4 py-2">
                  <div className="text-xl font-bold text-white">
                    {stakeAmount} ETB
                  </div>
                </div>
              </div>
              
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">
              Cartela No. {cardNumber}
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Review your selected bingo card. Confirm to add it to your game selection.
            </p>
          </div>

          {/* Single Card Display */}
          <div className="flex justify-center mb-8">
            {cards.map((card) => (
              <Card 
                key={card.id} 
                className={`bg-white border-0 shadow-2xl overflow-hidden max-w-sm transform transition-all duration-300 ${
                  card.isSelected ? 'ring-4 ring-green-400 scale-105' : ''
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
                  <CardTitle className="text-xl font-bold text-center">
                    Cartela No. {card.id}
                  </CardTitle>
                  <p className="text-blue-100 text-center text-sm">
                    Your unique bingo combination
                  </p>
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
                  <div className="grid grid-cols-5 gap-1 mb-4">
                    {card.numbers.map((column, colIndex) => (
                      column.map((number, rowIndex) => (
                        <div
                          key={`${colIndex}-${rowIndex}`}
                          className={`
                            w-full aspect-square rounded flex items-center justify-center text-sm font-bold
                            ${number === 0 ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' : 
                              getNumberColor(number, card.id)}
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

                  {/* Special Marking for Card 11 */}
                  {card.id === 11 && (
                    <div className="text-center mb-3">
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        Special Feature Card
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selection Summary */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-300 mb-1">Selection Summary</div>
                  <div className="text-2xl font-bold text-white">
                    1 Cartela Selected
                  </div>
                  <div className="text-sm text-blue-200 mt-1">
                    Cartela #{cardNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-300 mb-1">Total Cost</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stakeAmount} ETB
                  </div>
                  <div className="text-sm text-blue-200 mt-1">
                    Will be deducted from balance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Check */}
          {user && user.balance < stakeAmount && (
            <Card className="bg-red-500/20 border border-red-400/50 text-white mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <div className="font-semibold text-red-200">Insufficient Main Balance</div>
                    <div className="text-sm text-red-300">
                      You need {stakeAmount} ETB but only have {user.balance} ETB in main balance.
                    </div>
                    {user.bonusBalance >= stakeAmount && (
                      <div className="text-sm text-yellow-300 mt-1">
                        💰 Your bonus balance ({formatBalance(user.bonusBalance)}) will be used automatically.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bonus Usage Notice */}
          {user && user.bonusBalance > 0 && user.balance < stakeAmount && (
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-white mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <div className="font-semibold text-yellow-300">Bonus Balance Will Be Used</div>
                    <div className="text-sm text-yellow-200">
                      Your bonus balance of {formatBalance(user.bonusBalance)} will cover this purchase.
                    </div>
                    <div className="text-xs text-yellow-300 mt-1">
                      Remaining bonus after purchase: {formatBalance(user.bonusBalance - stakeAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white px-8 py-3"
            >
              ← Cancel Selection
            </Button>
            
            <Button
              onClick={handleConfirmCards}
              disabled={user && user.balance < stakeAmount}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Cartela
              <div className="ml-2 text-sm">({stakeAmount} ETB)</div>
            </Button>
          </div>

          {/* Instructions */}
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Important Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">✓</div>
                  <span>Confirming this cartela will cost {stakeAmount} ETB</span>
                </div>
                {user && user.balance >= stakeAmount && (
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs mt-0.5">✓</div>
                    <span>Amount will be deducted from your main balance</span>
                  </div>
                )}
                {user && user.balance < stakeAmount && user.bonusBalance >= stakeAmount && (
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs mt-0.5">🎁</div>
                    <span>Bonus balance will be used automatically</span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">✓</div>
                  <span>You can select multiple cartelas to increase your chances of winning</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">✓</div>
                  <span>Games start automatically when the timer reaches zero</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">✓</div>
                  <span>Win by completing any row, column, or diagonal on your cartela</span>
                </div>
                {user && user.bonusBalance > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs mt-0.5">💰</div>
                    <span>Your bonus balance ({formatBalance(user.bonusBalance)}) can be used for additional games</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}