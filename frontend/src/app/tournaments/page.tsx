'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Plus, Trophy, Clock, CalendarDays, Users } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'open' | 'ongoing' | 'completed';
  timeControl: string;
  startAt: string;
  createdBy: string;
  createdAt: string;
}

export default function TournamentsDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch tournaments
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: async () => (await api.get('/api/v1/tournaments')) as any,
  });

  // Create tournament mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; timeControl: string; startAt: string }) =>
      api.post('/api/v1/tournaments', data),
    onSuccess: () => {
      toast.success('Tournament created successfully');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create tournament');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      timeControl: formData.get('timeControl') as string,
      startAt: new Date(formData.get('startAt') as string).toISOString(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ongoing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 glass rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tournaments</h1>
          <p className="text-muted-foreground">
            {user?.role === 'coach' 
              ? 'Manage your tournaments and track student progress.' 
              : 'Join open tournaments and compete for the top rank.'}
          </p>
        </div>

        {user?.role === 'coach' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Create Tournament
              </Button>
            } />
            <DialogContent className="glass border-white/10 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Tournament</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input id="name" name="name" placeholder="Grand Arena Season 1" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeControl">Time Control</Label>
                  <Input id="timeControl" name="timeControl" placeholder="5+0" required pattern="^\d+\+\d+$" title="Format: minutes+increment (e.g. 5+0)" className="bg-background/50" />
                  <p className="text-xs text-muted-foreground">Format: minutes+increment (e.g., 5+0, 10+2)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startAt">Start Date & Time</Label>
                  <Input id="startAt" name="startAt" type="datetime-local" required className="bg-background/50" />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!tournaments?.length ? (
        <div className="flex flex-col items-center justify-center h-64 glass rounded-2xl border-dashed border-2 border-white/10">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium">No tournaments found</h3>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'coach' ? 'Create your first tournament to get started.' : 'Check back later for new tournaments.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="glass border-white/5 hover-lift h-full transition-colors hover:border-primary/30 cursor-pointer overflow-hidden group">
                <div className="h-2 w-full bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{t.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <span>Time Control: {t.timeControl}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="mr-2 h-4 w-4 text-accent" />
                    <span>{new Date(t.startAt).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
