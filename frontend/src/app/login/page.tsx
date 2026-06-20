'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/auth/login', { email, password });
      // Fetch user profile to populate store
      const user = await api.get('/api/v1/auth/me');
      setUser(user as any);
      toast.success('Welcome back to KOC Arena!');
      router.push('/tournaments');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      
      <Card className="w-full max-w-md glass border shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your arena.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="coach@koc.com"
                  className="pl-10 bg-background/50 border focus-visible:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-background/50 border focus-visible:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Join the Arena
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
