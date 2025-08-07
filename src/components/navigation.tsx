'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, Contact, Trophy, LogOut, User, Settings } from 'lucide-react';

interface NavigationProps {
  currentPage?: string;
}

export function Navigation({ currentPage = 'home' }: NavigationProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(balance);
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="text-white font-bold text-lg">E</div>
              </div>
              <div className="text-xl font-bold text-white">Ethio Bingo</div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Button 
                variant={currentPage === 'home' ? 'default' : 'ghost'} 
                className={`${
                  currentPage === 'home' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant={currentPage === 'contact' ? 'default' : 'ghost'} 
                className={`${
                  currentPage === 'contact' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Contact className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button 
                variant={currentPage === 'leaderboard' ? 'default' : 'ghost'} 
                className={`${
                  currentPage === 'leaderboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </div>

          {/* User Balance and Profile */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Balance Display */}
                <div className="hidden sm:block">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Total Balance</div>
                    <div className="text-lg font-bold text-white">
                      {formatBalance(user.balance + user.bonusBalance)}
                    </div>
                  </div>
                </div>
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                          {user.name?.[0] || user.phoneNumber[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-3">
                      <p className="text-sm font-medium leading-none text-gray-900">
                        {user.name || 'Player'}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.phoneNumber}
                      </p>
                      <div className="pt-2">
                        <div className="text-xs text-gray-500">Balance</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatBalance(user.balance + user.bonusBalance)}
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}