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
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center transition-transform hover:scale-105">
            <img src="/Kindomofchess-logo.webp" alt="Kingdom of Chess" className="h-12 sm:h-14 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation Links - Centered */}
        <div className="hidden lg:flex items-center gap-6 text-[13px] font-bold tracking-wider text-[#222222]">
          <Link href="/" className="hover:text-primary transition-colors border-b-2 border-primary pb-1 uppercase">Home</Link>
          <Link href="/about" className="hover:text-primary transition-colors uppercase">About Us ▾</Link>
          <Link href="/programs" className="hover:text-primary transition-colors uppercase">Chess Programs ▾</Link>
          <Link href="/success" className="hover:text-primary transition-colors uppercase">Success Stories</Link>
          <Link href="/learn" className="hover:text-primary transition-colors uppercase">Learn Chess ▾</Link>
          <Link href="/coaches" className="hover:text-primary transition-colors uppercase">Coaches</Link>
          
          {isAuthenticated && (
            <Link href="/tournaments" className="hover:text-primary transition-colors uppercase text-primary">Arena</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-bold text-gray-800 leading-none">{user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize mt-1">{user?.role}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="font-bold text-gray-600 hover:text-primary">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-[#F37021] to-[#F69259] hover:opacity-90 text-white shadow-xl shadow-[#F37021]/30 rounded-full px-6 h-10 font-bold transition-all hover:scale-105 border-0">
                  Book a Free trial Class
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
