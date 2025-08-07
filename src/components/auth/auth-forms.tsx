'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function AuthForms() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    phoneNumber: '',
    password: '',
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(loginData.phoneNumber, loginData.password);
    
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
    } else {
      toast({
        title: "Login failed",
        description: result.error || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const result = await register({
      phoneNumber: registerData.phoneNumber,
      password: registerData.password,
      name: registerData.name,
      email: registerData.email,
    });
    
    if (result.success) {
      toast({
        title: "Registration successful!",
        description: "Welcome to Ethio Bingo! You've received a 20 ETB signup bonus.",
      });
    } else {
      toast({
        title: "Registration failed",
        description: result.error || "Please check your information and try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <div className="text-white font-bold text-xl">E</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Ethio Bingo
          </h1>
          <p className="text-blue-200">
            Ethiopia's premier online bingo platform
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-blue-200">
              Sign in to access your account and start playing
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone" className="text-blue-200">Phone Number</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={loginData.phoneNumber}
                      onChange={(e) => setLoginData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-blue-200">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="text-blue-200">Phone Number</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={registerData.phoneNumber}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-blue-200">Full Name (Optional)</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-blue-200">Email (Optional)</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-blue-200">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-blue-200">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:border-blue-400"
                    />
                  </div>
                  
                  {/* Welcome Bonus Highlight */}
                  <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🎁</div>
                      <div>
                        <div className="text-green-300 font-semibold">Welcome Bonus!</div>
                        <div className="text-green-200 text-sm">Get 20 ETB bonus when you register</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-blue-300 text-sm">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}