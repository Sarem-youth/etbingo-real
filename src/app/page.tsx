'use client';

import { useAuth } from '@/contexts/auth-context';
import { AuthForms } from '@/components/auth/auth-forms';
import { Navigation } from '@/components/navigation';
import { NumberSelection } from '@/components/game/number-selection';
import { BingoCardDisplay } from '@/components/game/bingo-card-display';
import { LiveGame } from '@/components/game/live-game';
import { WinScreen } from '@/components/game/win-screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/socket-context';

interface StakeLevel {
  id: string;
  amount: number;
  isActive: boolean;
  possibleWin: number;
  active: boolean;
}

type GameScreen = 'stake-selection' | 'number-selection' | 'card-display' | 'live-game' | 'win-screen';

export default function Home() {
  const { user, isLoading, token } = useAuth();
  const { toast } = useToast();
  const { joinRoom, userId } = useSocket();
  const [stakeLevels, setStakeLevels] = useState<StakeLevel[]>([]);
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('stake-selection');
  const [selectedStake, setSelectedStake] = useState<StakeLevel | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedCardNumber, setSelectedCardNumber] = useState<number | null>(null);
  const [confirmedCartelas, setConfirmedCartelas] = useState<number[]>([]);
  const [roomTimers, setRoomTimers] = useState<{ [stakeAmount: number]: number }>({});
  const [gameWon, setGameWon] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winningCardNumber, setWinningCardNumber] = useState(0);

  useEffect(() => {
    // Simulate fetching stake levels - all rooms are now available by default
    const mockStakeLevels: StakeLevel[] = [
      { id: '1', amount: 10, isActive: true, possibleWin: 259, active: true },
      { id: '2', amount: 20, isActive: true, possibleWin: 518, active: true },
      { id: '3', amount: 50, isActive: true, possibleWin: 1295, active: true },
      { id: '4', amount: 100, isActive: true, possibleWin: 2590, active: true },
      { id: '5', amount: 200, isActive: true, possibleWin: 5180, active: true },
      { id: '6', amount: 300, isActive: true, possibleWin: 7770, active: true },
    ];
    setStakeLevels(mockStakeLevels);
  }, []);

  const handleJoinStake = (stakeLevel: StakeLevel) => {
    if (!user) return;

    // All rooms are now available by default
    // Join the room immediately when the join button is clicked
    if (userId) {
      joinRoom(stakeLevel.amount);
    }
    
    setSelectedStake(stakeLevel);
    setCurrentScreen('number-selection');
    toast({
      title: "Joining Game",
      description: `Joining ${stakeLevel.amount} ETB stake game...`,
    });
  };

  const handleCardSelected = (cardNumber: number) => {
    setSelectedCardNumber(cardNumber);
    setCurrentScreen('card-display');
  };

  const handleBackFromNumberSelection = () => {
    setCurrentScreen('stake-selection');
    setSelectedStake(null);
    setConfirmedCartelas([]); // Reset confirmed cartelas when going back
  };

  const handleCardsConfirmed = (selectedCards: number[]) => {
    // Add the confirmed cartela to the list
    setConfirmedCartelas(prev => [...prev, ...selectedCards]);
    setCurrentScreen('number-selection'); // Go back to selection page
    setSelectedCardNumber(null);
    
    toast({
      title: "Cartela Confirmed",
      description: `Cartela No.${selectedCards[0]} has been added to your selection.`,
    });
  };

  const handleBackFromCardDisplay = () => {
    setCurrentScreen('number-selection');
  };

  const handleStartGame = () => {
    if (confirmedCartelas.length === 0) {
      toast({
        title: "No Cartelas Selected",
        description: "Please select at least one cartela to start the game.",
        variant: "destructive",
      });
      return;
    }
    setCurrentScreen('live-game');
  };

  const handleGameEnd = (won: boolean, amount: number) => {
    setGameWon(won);
    setWinAmount(amount);
    setWinningCardNumber(confirmedCartelas[0]); // Use first cartela as winning card
    setCurrentScreen('win-screen');
  };

  const handlePlayAgain = () => {
    // Reset game state
    setGameWon(false);
    setWinAmount(0);
    setWinningCardNumber(0);
    setConfirmedCartelas([]);
    setSelectedStake(null);
    setCurrentScreen('stake-selection');
  };

  const handleGoHome = () => {
    // Reset game state
    setGameWon(false);
    setWinAmount(0);
    setWinningCardNumber(0);
    setConfirmedCartelas([]);
    setSelectedStake(null);
    setCurrentScreen('stake-selection');
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(balance);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate universal timer for all rooms (60-second cycles)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const secondsInCycle = 60;
      const currentSecond = Math.floor(now / 1000) % secondsInCycle;
      return secondsInCycle - currentSecond;
    };

    const updateTimers = () => {
      const timeLeft = calculateTimeLeft();
      const newTimers: { [stakeAmount: number]: number } = {};
      
      stakeLevels.forEach(stake => {
        newTimers[stake.amount] = timeLeft;
      });
      
      setRoomTimers(newTimers);
    };

    // Update immediately
    updateTimers();
    
    // Update every second
    const timerInterval = setInterval(updateTimers, 1000);
    
    return () => clearInterval(timerInterval);
  }, [stakeLevels]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForms />;
  }

  // Show bingo card display screen
  if (currentScreen === 'card-display' && selectedStake && selectedCardNumber) {
    return (
      <BingoCardDisplay
        stakeAmount={selectedStake.amount}
        selectedNumbers={selectedNumbers}
        cardNumber={selectedCardNumber}
        onCardsConfirmed={handleCardsConfirmed}
        onBack={handleBackFromCardDisplay}
      />
    );
  }

  // Show number selection screen
  if (currentScreen === 'number-selection' && selectedStake) {
    return (
      <NumberSelection
        stakeAmount={selectedStake.amount}
        onCardSelected={handleCardSelected}
        onBack={handleBackFromNumberSelection}
        confirmedCartelas={confirmedCartelas}
        onStartGame={handleStartGame}
      />
    );
  }

  // Show live game screen
  if (currentScreen === 'live-game' && selectedStake) {
    return (
      <LiveGame
        stakeAmount={selectedStake.amount}
        confirmedCartelas={confirmedCartelas}
        onGameEnd={handleGameEnd}
        onBack={handleBackFromNumberSelection}
      />
    );
  }

  // Show win screen
  if (currentScreen === 'win-screen') {
    return (
      <WinScreen
        won={gameWon}
        winAmount={winAmount}
        cardNumber={winningCardNumber}
        onPlayAgain={handlePlayAgain}
        onHome={handleGoHome}
      />
    );
  }

  // Show stake selection screen (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation currentPage="home" />
      
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Welcome to <span className="text-blue-400">Ethio Bingo</span>
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Experience Ethiopia's premier online bingo platform with exciting games and amazing prizes
            </p>
          </div>

          {/* User Balance Card */}
          <div className="mb-10">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-200 mb-1">Your Balance</h2>
                    <div className="text-3xl font-bold">
                      {formatBalance(user.balance + user.bonusBalance)}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-green-300">
                        Main: {formatBalance(user.balance)}
                      </span>
                      <span className="text-yellow-300">
                        Bonus: {formatBalance(user.bonusBalance)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-200 mb-1">Available Bonus</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {formatBalance(user.bonusBalance)}
                    </div>
                    <div className="text-xs text-blue-300 mt-1">
                      Use bonus to play games
                    </div>
                    {user.bonusBalance > 0 && (
                      <Badge className="bg-yellow-500 text-yellow-900 mt-2">
                        🎁 Active Bonus
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Bonus Banner */}
          {user.bonusBalance > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">🎉</div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-300">Welcome Bonus Active!</h3>
                      <p className="text-yellow-200">
                        You have {formatBalance(user.bonusBalance)} bonus balance to use for playing games
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {formatBalance(user.bonusBalance)}
                    </div>
                    <div className="text-sm text-yellow-300">Bonus Balance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Game</h2>
              <div className="text-sm text-blue-300">
                New games start every 60 seconds
              </div>
            </div>
            
            <Card className="bg-white border-0 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-6">
                <CardTitle className="text-xl font-semibold text-center">
                  Available Stake Levels
                </CardTitle>
                <p className="text-blue-100 text-center text-sm">
                  Select your preferred stake level to join the next game
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Stake Amount</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Time Remaining</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Potential Win</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stakeLevels.map((stake) => (
                        <tr 
                          key={stake.id} 
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-semibold text-gray-900">
                                {stake.amount} ETB
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-mono">
                                {formatTime(roomTimers[stake.amount] || 60)}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-green-600 font-semibold">
                              {stake.possibleWin > 0 ? `${stake.possibleWin} ETB` : '-'}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              onClick={() => handleJoinStake(stake)}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              Join Game
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="text-2xl">🎮</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-100">Active Games</div>
                    <div className="text-2xl font-bold">{stakeLevels.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="text-2xl">⏰</div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-100">Next Game In</div>
                    <div className="text-2xl font-bold">
                      {formatTime(Math.min(...Object.values(roomTimers)))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`bg-gradient-to-br ${user.bonusBalance > 0 ? 'from-yellow-500 to-orange-500' : 'from-gray-600 to-gray-700'} text-white border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="text-2xl">🎁</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">
                      {user.bonusBalance > 0 ? 'Your Bonus Balance' : 'Welcome Bonus'}
                    </div>
                    <div className="text-2xl font-bold">
                      {user.bonusBalance > 0 ? formatBalance(user.bonusBalance) : '20 ETB'}
                    </div>
                    {user.bonusBalance === 0 && (
                      <div className="text-xs opacity-75">Register to claim</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}