'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { UserPlus, Play, Trophy, Users, Clock, Hash } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  buchholz: number;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [isQueueing, setIsQueueing] = useState(false);

  // Queries
  const { data: tournament, isLoading: loadingT } = useQuery<any>({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => (await api.get(`/api/v1/tournaments/${tournamentId}`)) as any,
  });

  const { data: participants, isLoading: loadingP } = useQuery<any[]>({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => (await api.get(`/api/v1/tournaments/${tournamentId}/participants`)) as any,
  });

  const { data: leaderboard, isLoading: loadingL } = useQuery<LeaderboardEntry[]>({
    queryKey: ['tournament-leaderboard', tournamentId],
    queryFn: async () => (await api.get(`/api/v1/tournaments/${tournamentId}/leaderboard`)) as any,
  });

  // Check if current user is enrolled
  const isEnrolled = participants?.some((p: any) => p.userId === user?.id) || false;

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/tournaments/${tournamentId}/join`),
    onSuccess: () => {
      toast.success('Joined tournament!');
      queryClient.invalidateQueries({ queryKey: ['tournament-participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-leaderboard', tournamentId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to join tournament');
    },
  });

  // Socket Matchmaking listeners
  useEffect(() => {
    if (!socket) return;

    const onMatchReady = (data: { matchId: string }) => {
      setIsQueueing(false);
      toast.success('Match found! Redirecting to board...');
      router.push(`/matches/${data.matchId}`);
    };

    const onError = (data: { message: string }) => {
      setIsQueueing(false);
      toast.error(data.message);
    };

    socket.on('match:ready', onMatchReady);
    socket.on('error', onError);

    return () => {
      socket.off('match:ready', onMatchReady);
      socket.off('error', onError);
    };
  }, [socket, router]);

  const handleFindMatch = () => {
    if (!isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    setIsQueueing(true);
    socket.emit('matchmaking:join', { tournamentId });
    toast.info('Joined matchmaking queue. Waiting for opponent...');
  };

  if (loadingT || loadingP || loadingL) {
    return <div className="container mx-auto p-6 animate-pulse"><div className="h-32 glass rounded-xl mb-6"></div></div>;
  }

  if (!tournament) {
    return <div className="container mx-auto p-6 text-center text-red-400">Tournament not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header Card */}
      <Card className="glass overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-primary pointer-events-none">
          <Trophy className="h-48 w-48" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start z-10">
            <div>
              <CardTitle className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {tournament.name}
              </CardTitle>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {tournament.timeControl}</span>
                <span className="flex items-center"><Users className="w-4 h-4 mr-1"/> {participants?.length || 0} Players</span>
                <Badge variant="outline" className="uppercase">{tournament.status}</Badge>
              </div>
            </div>
            
            {user?.role === 'student' && tournament.status === 'open' && (
              <div className="z-10">
                {!isEnrolled ? (
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                  >
                    <UserPlus className="mr-2 h-5 w-5" /> Join Tournament
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className={`${isQueueing ? 'bg-accent animate-pulse' : 'bg-green-600 hover:bg-green-500'} text-white shadow-lg shadow-green-500/20`}
                    onClick={handleFindMatch}
                    disabled={isQueueing}
                  >
                    <Play className="mr-2 h-5 w-5" /> {isQueueing ? 'In Queue...' : 'Find Match'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Leaderboard */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="text-yellow-500 h-6 w-6" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!leaderboard?.length ? (
            <p className="text-muted-foreground text-center py-8">No games played yet. The arena awaits.</p>
          ) : (
            <div className="rounded-md border border-white/10 bg-background/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10">
                    <TableHead className="w-16 text-center"><Hash className="h-4 w-4 mx-auto"/></TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right text-primary font-bold">Score</TableHead>
                    <TableHead className="text-right text-muted-foreground">Buchholz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, idx) => (
                    <TableRow 
                      key={entry.userId} 
                      className={`border-white/10 transition-colors hover:bg-white/5 ${entry.userId === user?.id ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell className="text-center font-medium">
                        {idx === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> : 
                         idx === 1 ? <Crown className="h-5 w-5 text-gray-400 mx-auto" /> : 
                         idx === 2 ? <Crown className="h-5 w-5 text-amber-700 mx-auto" /> : 
                         idx + 1}
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        {entry.name}
                        {entry.userId === user?.id && <Badge variant="secondary" className="text-xs">You</Badge>}
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold text-primary">{entry.score}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{entry.buchholz}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
