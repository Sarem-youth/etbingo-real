'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Square, Clock } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/contexts/auth-context';
import { CartelaStatus } from '@/lib/socket';

interface NumberSelectionProps {
  stakeAmount: number;
  onCardSelected: (cardNumber: number) => void;
  onBack: () => void;
  confirmedCartelas?: number[]; // Add this to track confirmed cartelas
  onStartGame?: () => void; // Add this to handle starting the game
}

interface CartelaCard {
  id: number;
  cardNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  realTimeStatus?: CartelaStatus;
}

export function NumberSelection({ stakeAmount, onCardSelected, onBack, confirmedCartelas = [], onStartGame }: NumberSelectionProps) {
  const { toast } = useToast();
  const { socket, isConnected, userId, currentRoom, joinRoom } = useSocket();
  const { user, updateUserBalance } = useAuth();
  const [cards, setCards] = useState<CartelaCard[]>([]);
  
  // Use universal synchronized timer (same as main page)
  const [universalTimeLeft, setUniversalTimeLeft] = useState(60);

  // Universal synchronized timer (same logic as main page)
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
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const timerInterval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !userId || !currentRoom) return;

    // Request current cartela statuses when connected
    socket.emit('get-cartela-statuses', { roomId: currentRoom });

    // Listen for cartela status changes
    const handleCartelaStatusChanged = (data: { cartelaNumber: number; status: CartelaStatus; userId: string }) => {
      setCards(prevCards => 
        prevCards.map(card => 
          card.cardNumber === data.cartelaNumber 
            ? { ...card, realTimeStatus: data.status }
            : card
        )
      );
    };

    // Listen for own cartela confirmations (for green highlighting)
    const handleCartelaOwnConfirmed = (data: { cartelaNumber: number; status: CartelaStatus }) => {
      setCards(prevCards => 
        prevCards.map(card => 
          card.cardNumber === data.cartelaNumber 
            ? { ...card, realTimeStatus: data.status }
            : card
        )
      );
    };

    // Listen for initial cartela statuses
    const handleCartelaStatuses = (statuses: Array<{ cartelaNumber: number; status: CartelaStatus; userId: string | null }>) => {
      setCards(prevCards => 
        prevCards.map(card => {
          const status = statuses.find(s => s.cartelaNumber === card.cardNumber);
          return status ? { ...card, realTimeStatus: status.status } : card;
        })
      );
    };

    // Listen for universal timer updates (keep for room-specific timer if needed)
    const handleTimerUpdate = (data: { timeLeft: number; roomId: string }) => {
      if (data.roomId === currentRoom) {
        // We could use this for room-specific timer, but we'll use universal timer for synchronization
        // setTimeLeft(data.timeLeft);
      }
    };

    socket.on('cartela-status-changed', handleCartelaStatusChanged);
    socket.on('cartela-own-confirmed', handleCartelaOwnConfirmed);
    socket.on('cartela-statuses', handleCartelaStatuses);
    socket.on('timer-update', handleTimerUpdate);

    return () => {
      socket.off('cartela-status-changed', handleCartelaStatusChanged);
      socket.off('cartela-own-confirmed', handleCartelaOwnConfirmed);
      socket.off('cartela-statuses', handleCartelaStatuses);
      socket.off('timer-update', handleTimerUpdate);
    };
  }, [socket, isConnected, userId, currentRoom]);

  useEffect(() => {
    // Generate mock cartela cards (1-150 as shown in screenshot)
    const mockCards: CartelaCard[] = [];
    for (let i = 1; i <= 150; i++) {
      mockCards.push({
        id: i,
        cardNumber: i,
        isSelected: false,
        isHighlighted: false, // No more popular choices
      });
    }
    setCards(mockCards);

    // Only join room if not already joined (room joining happens when join button is clicked)
    // This ensures the timer starts immediately when the join button is clicked
  }, [stakeAmount]);

  // Listen for timer updates from window events (for immediate updates when joining room)
  useEffect(() => {
    const handleTimerUpdateEvent = (event: CustomEvent) => {
      const { timeLeft, roomId } = event.detail;
      if (roomId === currentRoom) {
        // We could use this for room-specific timer, but we'll use universal timer for synchronization
        // setTimeLeft(timeLeft);
      }
    };

    window.addEventListener('timer-update', handleTimerUpdateEvent as EventListener);

    return () => {
      window.removeEventListener('timer-update', handleTimerUpdateEvent as EventListener);
    };
  }, [currentRoom]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (card: CartelaCard) => {
    // Check if user can afford this cartela
    if (user && user.balance < stakeAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${stakeAmount} ETB to select this cartela, but you only have ${user.balance} ETB.`,
        variant: "destructive",
      });
      return;
    }

    // Don't allow clicking on already confirmed cartelas
    if (confirmedCartelas.includes(card.cardNumber)) {
      toast({
        title: "Cartela Already Confirmed",
        description: `Cartela No.${card.cardNumber} is already in your selection.`,
        variant: "destructive",
      });
      return;
    }

    // Don't allow clicking on cartelas selected by others
    if (card.realTimeStatus === 'selected-by-other' || card.realTimeStatus === 'confirmed-by-other') {
      toast({
        title: "Cartela Unavailable",
        description: `Cartela No.${card.cardNumber} is currently selected by another user.`,
        variant: "destructive",
      });
      return;
    }

    // Emit cartela selection event
    if (socket && isConnected && userId && currentRoom) {
      socket.emit('cartela-selected', {
        cartelaNumber: card.cardNumber,
        userId: userId,
        roomId: currentRoom
      });
    }

    // Navigate to the individual cartela page
    onCardSelected(card.cardNumber);
    toast({
      title: "Cartela Selected",
      description: `Viewing Cartela No.${card.cardNumber}`,
    });
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
            >
              ← Back to Games
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
                <div className="text-sm text-blue-300 mb-1">Cost Per Cartela</div>
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
              Select Your Cartela
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Choose from 150 available cartelas. Each cartela gives you a unique chance to win!
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {150 - cards.filter(card => 
                  card.realTimeStatus === 'confirmed-by-other' || 
                  card.realTimeStatus === 'confirmed-by-self' ||
                  confirmedCartelas.includes(card.cardNumber)
                ).length}
              </div>
              <div className="text-sm text-blue-300">Available Cartelas</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {confirmedCartelas.length}
              </div>
              <div className="text-sm text-blue-300">Your Selections</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {confirmedCartelas.length * stakeAmount}
              </div>
              <div className="text-sm text-blue-300">Total Cost (ETB)</div>
            </div>
          </div>

          {/* Cartela Grid */}
          <Card className="bg-white border-0 shadow-2xl overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
              <CardTitle className="text-xl font-semibold text-center">
                Available Cartelas (1-150)
              </CardTitle>
              <p className="text-blue-100 text-center text-sm">
                Click on any available cartela to view details
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-2 max-h-96 overflow-y-auto">
                {cards.map((card) => {
                  let bgColor = 'bg-gray-50 hover:bg-gray-100';
                  let cursorClass = 'cursor-pointer';
                  let textColor = 'text-gray-700';
                  let borderClass = 'border border-gray-200';
                  
                  // Priority order: own confirmed > other confirmed > other selected > confirmed cartelas > highlighted > default
                  if (card.realTimeStatus === 'confirmed-by-self' || confirmedCartelas.includes(card.cardNumber)) {
                    bgColor = 'bg-gradient-to-br from-green-500 to-green-600';
                    textColor = 'text-white';
                    cursorClass = 'cursor-not-allowed';
                    borderClass = 'border-2 border-green-400';
                  } else if (card.realTimeStatus === 'confirmed-by-other') {
                    bgColor = 'bg-gradient-to-br from-blue-500 to-blue-600';
                    textColor = 'text-white';
                    cursorClass = 'cursor-not-allowed';
                    borderClass = 'border-2 border-blue-400';
                  } else if (card.realTimeStatus === 'selected-by-other') {
                    bgColor = 'bg-gradient-to-br from-red-500 to-red-600';
                    textColor = 'text-white';
                    cursorClass = 'cursor-not-allowed';
                    borderClass = 'border-2 border-red-400';
                  }
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      disabled={
                        confirmedCartelas.includes(card.cardNumber) ||
                        card.realTimeStatus === 'selected-by-other' ||
                        card.realTimeStatus === 'confirmed-by-other' ||
                        card.realTimeStatus === 'confirmed-by-self'
                      }
                      className={`
                        w-full aspect-square rounded-lg font-bold text-sm transition-all duration-200
                        ${bgColor}
                        ${textColor}
                        ${cursorClass}
                        ${borderClass}
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${!confirmedCartelas.includes(card.cardNumber) && 
                          !card.realTimeStatus?.includes('other') && 
                          !card.realTimeStatus?.includes('self') ? 'hover:scale-105 shadow-md hover:shadow-lg' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-lg">{card.cardNumber}</div>
                        {(card.realTimeStatus === 'confirmed-by-self' || confirmedCartelas.includes(card.cardNumber)) && (
                          <div className="text-xs mt-1">✓</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-800 mb-3">Cartela Status Guide:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded border-2 border-green-400"></div>
                    <span className="text-sm text-gray-700">Your cartelas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded border-2 border-blue-400"></div>
                    <span className="text-sm text-gray-700">Others' cartelas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded border-2 border-red-400"></div>
                    <span className="text-sm text-gray-700">Being selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-50 border-2 border-gray-200 rounded"></div>
                    <span className="text-sm text-gray-700">Available</span>
                  </div>
                </div>
              </div>
              
              {confirmedCartelas.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-semibold text-green-800 mb-2">
                    Your Confirmed Cartelas:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {confirmedCartelas.sort((a, b) => a - b).map((cartela) => (
                      <span key={cartela} className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                        #{cartela}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bonus Usage Instructions */}
          {user && user.bonusBalance > 0 && (
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-white mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">💰</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">Bonus Balance Available!</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-yellow-200">
                        You have <span className="font-bold text-yellow-300">{formatBalance(user.bonusBalance)}</span> bonus balance to use for playing games.
                      </p>
                      <div className="bg-yellow-500/20 rounded-lg p-3">
                        <div className="font-semibold text-yellow-300 mb-1">How to use your bonus:</div>
                        <ul className="space-y-1 text-yellow-200">
                          <li>• Your bonus will be automatically used when you don't have enough main balance</li>
                          <li>• Bonus can be used to play any game at any stake level</li>
                          <li>• Winnings from bonus play are added to your main balance</li>
                          <li>• Bonus cannot be withdrawn but can be used to win real money</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Game Button */}
          {confirmedCartelas.length > 0 && (
            <div className="flex justify-center mb-8">
              <Button
                onClick={onStartGame}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-12 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🎮 Start Game ({confirmedCartelas.length} cartela{confirmedCartelas.length > 1 ? 's' : ''})
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">How to Play</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                    <span>Click on any available cartela number to view details</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                    <span>Review the cartela and confirm your selection</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                    <span>Select multiple cartelas for better winning chances</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">4</div>
                    <span>Wait for the game to start and good luck!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}