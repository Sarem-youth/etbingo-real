'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Navigation } from '@/components/navigation';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  Star,
  Target,
  Zap
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  totalWinnings: number;
  gamesPlayed: number;
  winRate: number;
  biggestWin: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

interface TimeFilter {
  label: string;
  value: 'daily' | 'weekly' | 'monthly' | 'alltime';
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('top-players');
  const [timeFilter, setTimeFilter] = useState('alltime');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const timeFilters: TimeFilter[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'All Time', value: 'alltime' }
  ];

  useEffect(() => {
    // Simulate loading leaderboard data
    const loadLeaderboardData = () => {
      setLoading(true);
      
      // Mock data based on time filter
      setTimeout(() => {
        const mockData: LeaderboardEntry[] = [
          {
            rank: 1,
            id: '1',
            name: 'BingoMaster',
            totalWinnings: 15420,
            gamesPlayed: 89,
            winRate: 78,
            biggestWin: 2590,
            currentStreak: 12,
          },
          {
            rank: 2,
            id: '2',
            name: 'LuckyStar',
            totalWinnings: 12350,
            gamesPlayed: 76,
            winRate: 72,
            biggestWin: 1295,
            currentStreak: 8,
          },
          {
            rank: 3,
            id: '3',
            name: 'EthioChamp',
            totalWinnings: 9870,
            gamesPlayed: 65,
            winRate: 68,
            biggestWin: 7770,
            currentStreak: 5,
          },
          {
            rank: 4,
            id: '4',
            name: 'NumberWizard',
            totalWinnings: 8650,
            gamesPlayed: 82,
            winRate: 65,
            biggestWin: 2590,
            currentStreak: 3,
          },
          {
            rank: 5,
            id: '5',
            name: 'CartelaKing',
            totalWinnings: 7430,
            gamesPlayed: 71,
            winRate: 62,
            biggestWin: 1295,
            currentStreak: 7,
          },
          {
            rank: 6,
            id: '6',
            name: 'BingoPro',
            totalWinnings: 6890,
            gamesPlayed: 58,
            winRate: 59,
            biggestWin: 2590,
            currentStreak: 2,
          },
          {
            rank: 7,
            id: '7',
            name: 'LuckySeven',
            totalWinnings: 5420,
            gamesPlayed: 67,
            winRate: 55,
            biggestWin: 1295,
            currentStreak: 4,
          },
          {
            rank: 8,
            id: '8',
            name: 'EthioWinner',
            totalWinnings: 4870,
            gamesPlayed: 54,
            winRate: 52,
            biggestWin: 7770,
            currentStreak: 1,
          },
          {
            rank: 9,
            id: '9',
            name: 'NumberNinja',
            totalWinnings: 4230,
            gamesPlayed: 61,
            winRate: 48,
            biggestWin: 1295,
            currentStreak: 6,
          },
          {
            rank: 10,
            id: '10',
            name: 'BingoStar',
            totalWinnings: 3890,
            gamesPlayed: 49,
            winRate: 45,
            biggestWin: 2590,
            currentStreak: 0,
          },
          {
            rank: 15,
            id: 'current-user',
            name: 'You',
            totalWinnings: 1250,
            gamesPlayed: 23,
            winRate: 35,
            biggestWin: 518,
            currentStreak: 1,
            isCurrentUser: true,
          }
        ];

        setLeaderboardData(mockData);
        setLoading(false);
      }, 1000);
    };

    loadLeaderboardData();
  }, [timeFilter]);

  const handleGoBack = () => {
    window.history.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return 'text-red-500';
    if (streak >= 5) return 'text-orange-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation currentPage="leaderboard" />
      
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
              <p className="text-xl text-blue-200">
                Top players and their achievements
              </p>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
              <div className="flex space-x-1">
                {timeFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={timeFilter === filter.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeFilter(filter.value)}
                    className={`${
                      timeFilter === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20">
              <TabsTrigger 
                value="top-players" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Top Players
              </TabsTrigger>
              <TabsTrigger 
                value="biggest-wins" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <Target className="w-4 h-4 mr-2" />
                Biggest Wins
              </TabsTrigger>
              <TabsTrigger 
                value="win-streaks" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Win Streaks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="top-players" className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Total Prize Pool</div>
                        <div className="text-2xl font-bold">78,420 ETB</div>
                      </div>
                      <Trophy className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Active Players</div>
                        <div className="text-2xl font-bold">1,247</div>
                      </div>
                      <TrendingUp className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Games Today</div>
                        <div className="text-2xl font-bold">3,891</div>
                      </div>
                      <Calendar className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Avg. Win Rate</div>
                        <div className="text-2xl font-bold">47%</div>
                      </div>
                      <Star className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leaderboard Table */}
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-6">
                  <CardTitle className="text-xl font-semibold">Top Players Rankings</CardTitle>
                  <p className="text-blue-100 text-sm">
                    The most successful bingo players this {timeFilter === 'alltime' ? 'all time' : timeFilter}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <div className="text-gray-600">Loading leaderboard...</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {leaderboardData
                        .sort((a, b) => a.rank - b.rank)
                        .map((player) => (
                          <div 
                            key={player.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              player.isCurrentUser ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              {/* Rank */}
                              <div className="flex-shrink-0">
                                {getRankIcon(player.rank)}
                              </div>
                              
                              {/* Avatar */}
                              <Avatar className="w-12 h-12 flex-shrink-0">
                                <AvatarFallback className={`${
                                  player.isCurrentUser 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {player.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Player Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <div className={`font-semibold ${
                                    player.isCurrentUser ? 'text-blue-600' : 'text-gray-900'
                                  }`}>
                                    {player.name}
                                  </div>
                                  {player.isCurrentUser && (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                      You
                                    </Badge>
                                  )}
                                  {player.rank <= 3 && (
                                    <Badge className={getRankBadgeColor(player.rank)}>
                                      #{player.rank}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {player.gamesPlayed} games • {player.winRate}% win rate
                                </div>
                              </div>
                              
                              {/* Stats */}
                              <div className="flex items-center space-x-6 text-sm">
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(player.totalWinnings)}
                                  </div>
                                  <div className="text-gray-500">Total Winnings</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-purple-600">
                                    {formatCurrency(player.biggestWin)}
                                  </div>
                                  <div className="text-gray-500">Biggest Win</div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-semibold ${getStreakColor(player.currentStreak)}`}>
                                    🔥 {player.currentStreak}
                                  </div>
                                  <div className="text-gray-500">Current Streak</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biggest-wins" className="space-y-6">
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white pb-6">
                  <CardTitle className="text-xl font-semibold">Biggest Wins</CardTitle>
                  <p className="text-green-100 text-sm">
                    Record-breaking wins in Ethio Bingo history
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { player: 'BingoMaster', amount: 2590, date: '2024-01-15', game: '300 ETB Stake' },
                      { player: 'EthioChamp', amount: 2590, date: '2024-01-12', game: '300 ETB Stake' },
                      { player: 'LuckyStar', amount: 1295, date: '2024-01-10', game: '200 ETB Stake' },
                      { player: 'NumberWizard', amount: 1295, date: '2024-01-08', game: '200 ETB Stake' },
                      { player: 'CartelaKing', amount: 1295, date: '2024-01-05', game: '200 ETB Stake' },
                    ].map((win, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{win.player}</div>
                            <div className="text-sm text-gray-600">{win.game}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(win.amount)}</div>
                          <div className="text-sm text-gray-500">{win.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="win-streaks" className="space-y-6">
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white pb-6">
                  <CardTitle className="text-xl font-semibold">Current Win Streaks</CardTitle>
                  <p className="text-orange-100 text-sm">
                    Players on fire with consecutive wins
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {leaderboardData
                      .filter(player => player.currentStreak > 0)
                      .sort((a, b) => b.currentStreak - a.currentStreak)
                      .slice(0, 10)
                      .map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{player.name}</div>
                              <div className="text-sm text-gray-600">{player.winRate}% win rate</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`text-2xl ${getStreakColor(player.currentStreak)}`}>
                              🔥
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-orange-600">{player.currentStreak} wins</div>
                              <div className="text-sm text-gray-500">Current streak</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}