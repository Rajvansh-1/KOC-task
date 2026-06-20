'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch current user on mount
    api
      .get('/api/v1/auth/me')
      .then((res: any) => {
        setUser(res);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (err: any) {
      toast.error(err.message || 'Logout failed');
    }
  };

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <img src="/Kindomofchess-logo.webp" alt="Kingdom of Chess" className="h-10 w-auto object-contain" />
          </Link>
          
          {isAuthenticated && (
            <div className="hidden md:flex gap-4">
              <Link href="/tournaments">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Tournaments
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-none">{user?.name}</span>
                  <span className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold text-foreground">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
