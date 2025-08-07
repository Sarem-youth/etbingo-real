'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, RotateCcw, Home, Gift, Star } from 'lucide-react';

interface WinScreenProps {
  won: boolean;
  winAmount: number;
  cardNumber: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function WinScreen({ 
  won, 
  winAmount, 
  cardNumber, 
  onPlayAgain, 
  onHome 
}: WinScreenProps) {
  const { toast } = useToast();

  const handlePlayAgain = () => {
    toast({
      title: "Starting New Game",
      description: "Good luck with your next game!",
    });
    onPlayAgain();
  };

  const handleGoHome = () => {
    toast({
      title: "Returning Home",
      description: "Thanks for playing!",
    });
    onHome();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Win/Loss Card */}
        <Card className={`bg-white border-0 shadow-2xl overflow-hidden transform transition-all duration-500 ${
          won ? 'ring-8 ring-yellow-400 scale-105' : ''
        }`}>
          <CardHeader className={`text-white pb-8 text-center ${
            won 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
            <div className="flex justify-center mb-4">
              {won ? (
                <div className="text-6xl animate-bounce">🎉</div>
              ) : (
                <div className="text-6xl">😔</div>
              )}
            </div>
            <CardTitle className="text-3xl font-bold">
              {won ? 'Congratulations!' : 'Game Over'}
            </CardTitle>
            <p className="text-lg opacity-90 mt-2">
              {won 
                ? 'You are a winner today!' 
                : 'Better luck next time!'
              }
            </p>
          </CardHeader>
          
          <CardContent className="p-8 text-center">
            {/* Win Amount */}
            {won && (
              <div className="mb-8">
                <div className="text-sm text-gray-500 mb-2">You Won</div>
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {winAmount} ETB
                </div>
                <div className="text-sm text-gray-500">
                  Prize has been added to your balance
                </div>
              </div>
            )}

            {/* Winning Card */}
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-3">Winning Card</div>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 max-w-xs mx-auto">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      🎯 Cartela No. {cardNumber}
                    </div>
                    <div className="text-sm text-blue-500">
                      {won ? 'BINGO!' : 'Better luck next time'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">🎮</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                  <div className="text-lg font-bold text-green-600">1</div>
                </CardContent>
              </Card>
              
              <Card className={`bg-gradient-to-br ${won ? 'from-yellow-50 to-yellow-100' : 'from-gray-50 to-gray-100'} border ${won ? 'border-yellow-200' : 'border-gray-200'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">{won ? '🏆' : '📊'}</div>
                  <div className="text-sm text-gray-600">{won ? 'Win Rate' : 'Total Spent'}</div>
                  <div className={`text-lg font-bold ${won ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {won ? '100%' : '0 ETB'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Special Message */}
            {won && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-3">
                    <Star className="w-6 h-6 text-purple-500" />
                    <div>
                      <div className="font-semibold text-purple-700">Amazing Performance!</div>
                      <div className="text-sm text-purple-600">
                        You've mastered the art of bingo!
                      </div>
                    </div>
                    <Star className="w-6 h-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePlayAgain}
                className={`flex-1 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${
                  won 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 px-8 py-3 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Bonus Offer */}
            {won && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-yellow-600" />
                  <div className="text-sm text-yellow-700">
                    <span className="font-semibold">Special Offer:</span> Share your win with friends and get bonus rewards!
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fun Facts */}
        <Card className="mt-6 bg-white/5 backdrop-blur-md border border-white/10 text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-center">Did You Know?</h3>
            <div className="text-sm text-center text-blue-200">
              {won 
                ? "You're part of an elite group of bingo winners! Only 1 in 10 players win on their first try."
                : "Every game brings you closer to victory! The more you play, the better your chances become."
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}