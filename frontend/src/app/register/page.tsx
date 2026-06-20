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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import { KeyRound, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'coach' | 'student'>('student');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', { name, email, password, role });
      // Login automatically
      await api.post('/api/v1/auth/login', { email, password });
      const user = await api.get('/api/v1/auth/me');
      setUser(user as any);
      toast.success('Registration successful!');
      router.push('/tournaments');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      
      <Card className="w-full max-w-md glass border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the elite Kingdom of Chess Arena.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Magnus Carlsen"
                  className="pl-10 bg-background/50 border focus-visible:ring-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="magnus@koc.com"
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

            <div className="space-y-3 pt-2">
              <Label>I am a...</Label>
              <RadioGroup defaultValue="student" onValueChange={(v) => setRole(v as 'coach'|'student')} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-background/50 border border px-4 py-3 rounded-lg flex-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="student" id="r-student" />
                  <Label htmlFor="r-student" className="cursor-pointer">Student</Label>
                </div>
                <div className="flex items-center space-x-2 bg-background/50 border border px-4 py-3 rounded-lg flex-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="coach" id="r-coach" />
                  <Label htmlFor="r-coach" className="cursor-pointer">Coach</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
