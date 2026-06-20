'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowRight, Trophy, Swords, Crown } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)]">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-30" />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl mx-auto py-20 mt-10">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          KOC Arena v1.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in zoom-in duration-700 delay-100">
          The Ultimate <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent">
            Chess Matchmaking
          </span> Platform
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Compete in high-stakes tournaments. Get paired instantly. Climb the global leaderboard. Master the board.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {!isLoading && isAuthenticated ? (
            <Link href="/tournaments">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 rounded-full">
                Enter Arena <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 rounded-full">
                Join the Arena <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
          {!isAuthenticated && (
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 bg-background/50 backdrop-blur-md hover:bg-white/5 transition-all hover:scale-105 rounded-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center hover-lift">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
            <Trophy className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Live Tournaments</h3>
          <p className="text-muted-foreground">Coaches create Swiss-system tournaments with automated pairings and real-time standings.</p>
        </div>

        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center hover-lift">
          <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 text-accent-foreground">
            <Swords className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Matchmaking</h3>
          <p className="text-muted-foreground">Queue up and get paired instantly against opponents of similar skill within your tournament.</p>
        </div>

        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center hover-lift">
          <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
            <Crown className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Global Leaderboards</h3>
          <p className="text-muted-foreground">Standard chess scoring with Buchholz tie-breaking to determine the undisputed champions.</p>
        </div>
      </div>
    </div>
  );
}
