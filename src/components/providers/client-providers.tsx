'use client';

import { useAuth } from '@/contexts/auth-context';
import { SocketProvider } from '@/contexts/socket-context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return (
    <SocketProvider userId={user?.id || null}>
      {children}
    </SocketProvider>
  );
}