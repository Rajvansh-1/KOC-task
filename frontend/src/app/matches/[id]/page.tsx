'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { useMatchStore } from '@/store/useMatchStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Flag, ShieldAlert, Trophy, ShieldBan } from 'lucide-react';

export default function MatchPage() {
  const params = useParams();
  if (!params) return null;
  const matchId = params.id as string;
  
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const matchState = useMatchStore();
  const [chess] = useState(new Chess());

  const [gameOverModalOpen, setGameOverModalOpen] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join match room
    socket.emit('match:join', { matchId });

    const onMatchState = (data: any) => {
      matchState.setMatchState({
        matchId: data.id,
        status: data.status,
        fen: data.fen,
        pgn: data.pgn,
        turn: data.turn,
        whitePlayer: data.whitePlayer,
        blackPlayer: data.blackPlayer,
        whiteTimeMs: data.whiteTimeMs,
        blackTimeMs: data.blackTimeMs,
        result: data.result,
        resultReason: data.resultReason,
        winnerName: data.winnerName,
      });

      if (data.status === 'completed' || data.status === 'drawn') {
        setGameOverModalOpen(true);
      }

      // Sync local chess.js instance
      try {
        if (data.pgn) {
          chess.loadPgn(data.pgn);
        } else {
          chess.load(data.fen);
        }
      } catch (e) {
        console.error('Failed to load board state', e);
      }

      // Determine local player color
      if (user) {
        if (data.whitePlayer.id === user.id) matchState.setMatchState({ myColor: 'white' });
        else if (data.blackPlayer.id === user.id) matchState.setMatchState({ myColor: 'black' });
        else matchState.setMatchState({ myColor: null }); // Spectator
      }
    };

    const onTimeUpdate = (data: { whiteTimeMs: number; blackTimeMs: number }) => {
      matchState.updateTime(data.whiteTimeMs, data.blackTimeMs);
    };

    const onMovePlayed = (data: { fen: string; pgn: string; move: any; turn: 'white' | 'black' }) => {
      try {
        chess.loadPgn(data.pgn);
        matchState.setMatchState({
          fen: data.fen,
          pgn: data.pgn,
          turn: data.turn,
        });
      } catch (e) {
        console.error(e);
      }
    };

    const onMatchEnded = (data: { result: string; reason: string; winnerName: string; newRankings: any }) => {
      matchState.setMatchState({
        status: data.result === '1/2-1/2' ? 'drawn' : 'completed',
        result: data.result,
        resultReason: data.reason,
        winnerName: data.winnerName,
      });
      setGameOverModalOpen(true);
    };

    const onError = (data: { message: string }) => {
      console.error('Socket error/exception:', data);
      toast.error(data.message || 'An error occurred');
    };

    socket.on('match:state', onMatchState);
    socket.on('clock:tick', onTimeUpdate);
    socket.on('move:made', onMovePlayed);
    socket.on('game:over', onMatchEnded);
    socket.on('error', onError);
    socket.on('exception', onError);

    return () => {
      socket.off('match:state', onMatchState);
      socket.off('clock:tick', onTimeUpdate);
      socket.off('move:made', onMovePlayed);
      socket.off('game:over', onMatchEnded);
      socket.off('error', onError);
      socket.off('exception', onError);
    };
  }, [socket, isConnected, matchId, user, chess]); // eslint-disable-line

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (matchState.status !== 'active') return false;
    if (matchState.myColor && matchState.turn !== matchState.myColor) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity in this task
      });

      if (move === null) return false;

      // Optimistic update locally
      matchState.setMatchState({
        fen: chess.fen(),
        pgn: chess.pgn(),
      });

      // Send to server
      socket.emit('move:make', {
        matchId,
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      return true;
    } catch (e) {
      return false;
    }
  };

  const handleResign = () => {
    if (confirm('Are you sure you want to resign?')) {
      socket.emit('game:resign', { matchId });
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!matchState.whitePlayer) {
    return <div className="container mx-auto p-6 text-center animate-pulse">Loading match...</div>;
  }

  const isPlayer = !!matchState.myColor;
  const boardOrientation = matchState.myColor === 'black' ? 'black' : 'white';
  const opponent = matchState.myColor === 'white' ? matchState.blackPlayer : matchState.whitePlayer;
  const opponentTime = matchState.myColor === 'white' ? matchState.blackTimeMs : matchState.whiteTimeMs;
  const self = matchState.myColor === 'white' ? matchState.whitePlayer : matchState.blackPlayer;
  const selfTime = matchState.myColor === 'white' ? matchState.whiteTimeMs : matchState.blackTimeMs;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        
        {/* Chessboard Area */}
        <div className="flex flex-col gap-4 mx-auto w-full max-w-2xl">
          {isPlayer && (
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-md">
              <div className="font-semibold text-lg">{opponent?.name || 'Opponent'}</div>
              <div className={`font-mono text-2xl font-bold ${matchState.turn !== matchState.myColor && matchState.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                {formatTime(opponentTime)}
              </div>
            </div>
          )}

          <div className="rounded-md overflow-hidden border-4 border-white/5 shadow-2xl">
            <Chessboard
              position={matchState.fen}
              onPieceDrop={(source, target) => onDrop(source, target)}
              boardOrientation={boardOrientation}
              customDarkSquareStyle={{ backgroundColor: '#2e3240' }}
              customLightSquareStyle={{ backgroundColor: '#757e96' }}
              isDraggablePiece={({ piece }: { piece: string }) => {
                if (!isPlayer || matchState.status !== 'active') return false;
                return piece.startsWith(matchState.myColor!.charAt(0)); // 'w' or 'b'
              }}
            />
          </div>

          {isPlayer && (
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-md">
              <div className="font-semibold text-lg">{self?.name || 'You'}</div>
              <div className={`font-mono text-2xl font-bold ${matchState.turn === matchState.myColor && matchState.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formatTime(selfTime)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-6">
          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-muted-foreground uppercase tracking-widest text-xs">Match Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="uppercase font-bold">{matchState.status}</Badge>
                </div>
                
                {matchState.result && (
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-sm font-semibold">Result</span>
                    <span>{matchState.result}</span>
                  </div>
                )}
                
                {isPlayer && matchState.status === 'active' && (
                  <Button 
                    variant="destructive" 
                    className="w-full mt-4 bg-destructive/80 hover:bg-destructive"
                    onClick={handleResign}
                  >
                    <Flag className="mr-2 h-4 w-4" /> Resign
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={gameOverModalOpen} onOpenChange={setGameOverModalOpen}>
        <DialogContent className="glass border-white/10 text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center">
              {matchState.result === '1/2-1/2' ? 'Draw' : 'Match Over'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center gap-4">
            {matchState.result === '1/2-1/2' ? (
              <ShieldAlert className="h-16 w-16 text-yellow-500" />
            ) : matchState.winnerName === user?.name ? (
              <Trophy className="h-20 w-20 text-yellow-500" />
            ) : (
              <ShieldBan className="h-16 w-16 text-red-500" />
            )}
            
            <h2 className="text-xl font-semibold">
              {matchState.resultReason}
            </h2>
            
            <p className="text-muted-foreground">
              {matchState.winnerName 
                ? `${matchState.winnerName} won the match.` 
                : 'The match ended in a draw.'}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={() => router.push('/tournaments')} className="w-full bg-primary hover:bg-primary/90 text-white">
              Return to Tournaments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
