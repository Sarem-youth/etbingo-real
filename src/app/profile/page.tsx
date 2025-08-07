'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  CreditCard, 
  History, 
  TrendingUp, 
  Award,
  ArrowLeft,
  Edit,
  Save,
  Phone,
  Mail,
  Calendar,
  Target,
  Star,
  Gift,
  Shield,
  Bell,
  Download
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'win' | 'loss' | 'bonus';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface GameStats {
  totalGames: number;
  totalWinnings: number;
  totalLosses: number;
  winRate: number;
  biggestWin: number;
  currentStreak: number;
  favoriteStake: number;
}

export default function ProfilePage() {
  const { user, updateUserBalance } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber
      });
    }
    loadUserData();
  }, [user]);

  const loadUserData = () => {
    setLoading(true);
    
    // Mock transactions data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'bonus',
        amount: 20,
        description: 'Welcome Bonus',
        date: '2024-01-15T10:30:00Z',
        status: 'completed'
      },
      {
        id: '2',
        type: 'loss',
        amount: -10,
        description: 'Game Stake',
        date: '2024-01-15T11:15:00Z',
        status: 'completed'
      },
      {
        id: '3',
        type: 'win',
        amount: 259,
        description: 'Bingo Win - 10 ETB Stake',
        date: '2024-01-15T11:45:00Z',
        status: 'completed'
      },
      {
        id: '4',
        type: 'deposit',
        amount: 100,
        description: 'Mobile Money Deposit',
        date: '2024-01-14T15:20:00Z',
        status: 'completed'
      },
      {
        id: '5',
        type: 'loss',
        amount: -20,
        description: 'Game Stake',
        date: '2024-01-14T16:10:00Z',
        status: 'completed'
      }
    ];

    // Mock game stats
    const mockStats: GameStats = {
      totalGames: 23,
      totalWinnings: 1250,
      totalLosses: 890,
      winRate: 35,
      biggestWin: 259,
      currentStreak: 1,
      favoriteStake: 10
    };

    setTransactions(mockTransactions);
    setGameStats(mockStats);
    setLoading(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    // Simulate saving profile
    setTimeout(() => {
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    }, 1000);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <CreditCard className="w-4 h-4 text-red-600" />;
      case 'win':
        return <Award className="w-4 h-4 text-green-600" />;
      case 'loss':
        return <Target className="w-4 h-4 text-red-600" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-yellow-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'bonus':
        return 'text-green-600';
      case 'withdrawal':
      case 'loss':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation currentPage="profile" />
      
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
              <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-xl text-blue-200">
                Manage your account and view your gaming statistics
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md border border-white/20">
              <TabsTrigger 
                value="overview" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="statistics" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="text-white data-[state=active]:bg-blue-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Card */}
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
                    {!isEditing && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEditProfile}
                        className="bg-white text-blue-600 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-6">
                    {/* Avatar */}
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                        {user.name?.[0] || user.phoneNumber[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Profile Info */}
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <Input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleInputChange}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleInputChange}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <Input
                              type="tel"
                              name="phone"
                              value={editForm.phone}
                              onChange={handleInputChange}
                              className="w-full"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleSaveProfile}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-500">Full Name</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {user.name || 'Not set'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Email Address</div>
                            <div className="text-lg font-semibold text-gray-900 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {user.email || 'Not set'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Phone Number</div>
                            <div className="text-lg font-semibold text-gray-900 flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {user.phoneNumber}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Member Since</div>
                            <div className="text-lg font-semibold text-gray-900 flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Main Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(user.balance)}</div>
                      </div>
                      <CreditCard className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Bonus Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(user.bonusBalance)}</div>
                      </div>
                      <Gift className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Total Balance</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(user.balance + user.bonusBalance)}
                        </div>
                      </div>
                      <Award className="w-8 h-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">Transaction History</CardTitle>
                    <Button variant="secondary" size="sm" className="bg-white text-green-600 hover:bg-gray-100">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <div className="text-gray-600">Loading transactions...</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(transaction.type)}
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {transaction.description}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(transaction.date)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                </div>
                                <Badge className={getStatusColor(transaction.status)}>
                                  {transaction.status}
                                </Badge>
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

            <TabsContent value="statistics" className="space-y-6">
              {gameStats && (
                <>
                  {/* Game Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Total Games</div>
                            <div className="text-2xl font-bold text-gray-900">{gameStats.totalGames}</div>
                          </div>
                          <Target className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Win Rate</div>
                            <div className="text-2xl font-bold text-green-600">{gameStats.winRate}%</div>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Biggest Win</div>
                            <div className="text-2xl font-bold text-purple-600">
                              {formatCurrency(gameStats.biggestWin)}
                            </div>
                          </div>
                          <Award className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-0 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Current Streak</div>
                            <div className="text-2xl font-bold text-orange-600">
                              🔥 {gameStats.currentStreak}
                            </div>
                          </div>
                          <Star className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Stats */}
                  <Card className="bg-white border-0 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white pb-6">
                      <CardTitle className="text-xl font-semibold">Detailed Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div className="text-green-800 font-semibold">Total Winnings</div>
                            <div className="text-green-600 font-bold">
                              {formatCurrency(gameStats.totalWinnings)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div className="text-red-800 font-semibold">Total Losses</div>
                            <div className="text-red-600 font-bold">
                              {formatCurrency(gameStats.totalLosses)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-blue-800 font-semibold">Net Profit</div>
                            <div className={`font-bold ${
                              gameStats.totalWinnings - gameStats.totalLosses > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(gameStats.totalWinnings - gameStats.totalLosses)}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-purple-800 font-semibold">Favorite Stake</div>
                            <div className="text-purple-600 font-bold">
                              {formatCurrency(gameStats.favoriteStake)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-yellow-800 font-semibold">Average Win</div>
                            <div className="text-yellow-600 font-bold">
                              {formatCurrency(gameStats.totalWinnings / Math.max(1, Math.floor(gameStats.totalGames * gameStats.winRate / 100)))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-gray-800 font-semibold">Games per Day</div>
                            <div className="text-gray-600 font-bold">
                              {(gameStats.totalGames / 30).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white pb-6">
                  <CardTitle className="text-xl font-semibold">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Security Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-gray-600" />
                        Security
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">Change Password</div>
                            <div className="text-sm text-gray-600">Update your account password</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Change
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                            <div className="text-sm text-gray-600">Add an extra layer of security</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Enable
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-gray-600" />
                        Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">Email Notifications</div>
                            <div className="text-sm text-gray-600">Receive updates via email</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">SMS Notifications</div>
                            <div className="text-sm text-gray-600">Get alerts on your phone</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="w-4 h-4 mr-2" />
                          Download My Data
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
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