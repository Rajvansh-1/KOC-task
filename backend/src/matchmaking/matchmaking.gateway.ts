import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { MatchesService } from '../matches/matches.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { JwtService } from '@nestjs/jwt';

interface QueueEntry {
  userId: string;
  socketId: string;
  name: string;
  enqueuedAt: number;
}

interface LiveMatchState {
  game: Chess;                  // server-side chess.js — source of truth
  whitePlayerId: string;
  blackPlayerId: string;
  whitePlayerName: string;
  blackPlayerName: string;
  tournamentId: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveAt: number;           // timestamp of last move (for clock deduction)
  moveCount: number;
  clockInterval: NodeJS.Timeout | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MatchmakingGateway.name);

  // In-memory matchmaking queues: tournamentId → waiting players
  private queues = new Map<string, QueueEntry[]>();

  // In-memory live match states: matchId → LiveMatchState
  private liveMatches = new Map<string, LiveMatchState>();

  // Track which match a socket is in: socketId → matchId
  private socketToMatch = new Map<string, string>();

  constructor(
    private readonly matchesService: MatchesService,
    private readonly tournamentsService: TournamentsService,
    private readonly leaderboardService: LeaderboardService,
    private readonly jwtService: JwtService,
  ) {}

  // ── CONNECTION ────────────────────────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      // Authenticate on connect
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const token = this.parseCookies(cookieHeader)['jwt'];
      if (!token) { client.disconnect(); return; }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'koc_dev_secret_change_in_production_2026',
      });

      client.data.userId = payload.sub;
      client.data.role   = payload.role;
      client.data.name   = payload.name;
      this.logger.log(`Connected: ${payload.name} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.data.name ?? client.id}`);

    // Notify opponent if in a match
    const matchId = this.socketToMatch.get(client.id);
    if (matchId) {
      this.server.to(`match:${matchId}`).emit('player:disconnected', {
        userId: client.data.userId,
        name:   client.data.name,
      });
      this.socketToMatch.delete(client.id);
    }

    // Remove from any queue
    this.removeFromAllQueues(client.id);
  }

  // ── MATCHMAKING ────────────────────────────────────────────────────────────

  @SubscribeMessage('matchmaking:join')
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string },
  ) {
    const { userId, name } = client.data;
    const { tournamentId } = data;

    // Guard 1: already in an active match?
    const activeMatch = await this.matchesService.findActiveMatchForUser(userId);
    if (activeMatch) {
      throw new WsException('You are already in an active match');
    }

    // Guard 2: is a participant?
    const isParticipant = await this.tournamentsService.isParticipant(tournamentId, userId);
    if (!isParticipant) {
      throw new WsException('You are not a participant of this tournament');
    }

    // Guard 3: already in this queue?
    const queue = this.queues.get(tournamentId) ?? [];
    if (queue.find((e) => e.userId === userId)) {
      throw new WsException('Already in the matchmaking queue');
    }

    // Enqueue
    queue.push({ userId, socketId: client.id, name, enqueuedAt: Date.now() });
    this.queues.set(tournamentId, queue);

    client.emit('matchmaking:queued', { position: queue.length });
    this.logger.log(`${name} queued for tournament ${tournamentId}`);

    // Try to pair
    await this.tryPair(tournamentId);
  }

  @SubscribeMessage('matchmaking:leave')
  handleLeaveQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string },
  ) {
    const queue = this.queues.get(data.tournamentId) ?? [];
    this.queues.set(
      data.tournamentId,
      queue.filter((e) => e.socketId !== client.id),
    );
    client.emit('matchmaking:dequeued', {});
  }

  private async tryPair(tournamentId: string) {
    const queue = this.queues.get(tournamentId) ?? [];
    if (queue.length < 2) return;

    // Dequeue first two (FIFO)
    const [playerA, playerB] = queue.splice(0, 2);
    this.queues.set(tournamentId, queue);

    // Randomly assign colours
    const [white, black] =
      Math.random() > 0.5 ? [playerA, playerB] : [playerB, playerA];

    const match = await this.matchesService.createMatch(
      tournamentId,
      white.userId,
      black.userId,
    );

    this.logger.log(`Paired: ${white.name} (white) vs ${black.name} (black) — match ${match.id}`);

    // Push match:ready to both clients immediately
    this.server.to(white.socketId).emit('match:ready', {
      matchId: match.id,
      color:   'white',
      opponent: black.name,
    });
    this.server.to(black.socketId).emit('match:ready', {
      matchId: match.id,
      color:   'black',
      opponent: white.name,
    });
  }

  // ── MATCH ROOM ────────────────────────────────────────────────────────────

  @SubscribeMessage('match:join')
  async handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { userId, name } = client.data;
    const { matchId } = data;
    this.logger.log(`Received match:join from ${name} (${userId}) for match ${matchId}`);

    try {
      const match = await this.matchesService.findByIdWithPlayers(matchId);

      // Only participants may join the match room
      if (match.whitePlayer.id !== userId && match.blackPlayer.id !== userId) {
        this.logger.error(`User ${userId} is not in match ${matchId}`);
        throw new WsException('You are not a participant of this match');
      }

    // Join the Socket.IO room
    await client.join(`match:${matchId}`);
    this.socketToMatch.set(client.id, matchId);

    // Initialise live match state if not already there
    if (!this.liveMatches.has(matchId) && match.status === 'active') {
      const game = new Chess(match.fen);
      const state: LiveMatchState = {
        game,
        whitePlayerId:   match.whitePlayer.id,
        blackPlayerId:   match.blackPlayer.id,
        whitePlayerName: match.whitePlayer.name,
        blackPlayerName: match.blackPlayer.name,
        tournamentId:    match.tournamentId,
        whiteTimeMs:     match.whiteTimeRemainingMs,
        blackTimeMs:     match.blackTimeRemainingMs,
        lastMoveAt:      Date.now(),
        moveCount:       0,
        clockInterval:   null,
      };
      this.liveMatches.set(matchId, state);
      this.startClockTick(matchId);
    }

      const state = this.liveMatches.get(matchId);

      // Send full match state (handles reconnection)
      client.emit('match:state', {
        matchId,
        fen:          state?.game.fen() ?? match.fen,
        pgn:          state?.game.pgn() ?? match.pgn ?? '',
        turn:         state?.game.turn() === 'w' ? 'white' : 'black',
        whiteTimeMs:  state?.whiteTimeMs ?? match.whiteTimeRemainingMs,
        blackTimeMs:  state?.blackTimeMs ?? match.blackTimeRemainingMs,
        status:       match.status,
        whitePlayer:  match.whitePlayer,
        blackPlayer:  match.blackPlayer,
      });

      // Notify opponent that this player (re)connected
      client.to(`match:${matchId}`).emit('player:reconnected', { userId, name });

      this.logger.log(`${name} joined match room ${matchId}`);
    } catch (error: any) {
      this.logger.error(`Error in handleJoinMatch: ${error.message}`);
      throw new WsException(error.message || 'Internal server error');
    }
  }

  // ── MOVES ─────────────────────────────────────────────────────────────────

  @SubscribeMessage('move:make')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; from: string; to: string; promotion?: string },
  ) {
    try {
      const { userId } = client.data;
      const { matchId, from, to, promotion } = data;
      this.logger.log(`Received move from ${userId} for match ${matchId}: ${from} -> ${to}`);

      const state = this.liveMatches.get(matchId);
      if (!state) throw new WsException('Match not found or not active');

      // Verify it's this player's turn
      const isWhite = state.whitePlayerId === userId;
      const isBlack = state.blackPlayerId === userId;
      if (!isWhite && !isBlack) throw new WsException('You are not in this match');

    const currentTurn = state.game.turn(); // 'w' or 'b'
    if ((currentTurn === 'w' && !isWhite) || (currentTurn === 'b' && !isBlack)) {
      client.emit('move:invalid', { reason: 'Not your turn' });
      return;
    }

    // Deduct elapsed time from active player's clock
    const elapsed = Date.now() - state.lastMoveAt;
    if (currentTurn === 'w') {
      state.whiteTimeMs = Math.max(0, state.whiteTimeMs - elapsed);
    } else {
      state.blackTimeMs = Math.max(0, state.blackTimeMs - elapsed);
    }

    // Check for timeout before processing the move
    const activeTimeMs = currentTurn === 'w' ? state.whiteTimeMs : state.blackTimeMs;
    if (activeTimeMs <= 0) {
      const result   = currentTurn === 'w' ? 'black_wins' : 'white_wins';
      const winnerId = result === 'white_wins' ? state.whitePlayerId : state.blackPlayerId;
      await this.endMatch(matchId, state, result, 'timeout');
      return;
    }

    // chess.js validates move legality
    const moveResult = state.game.move({ from, to, promotion });
    if (!moveResult) {
      client.emit('move:invalid', { reason: 'Illegal move' });
      return;
    }

    state.moveCount += 1;
    state.lastMoveAt = Date.now();

    const newFen = state.game.fen();
    const timeRemainingMs = currentTurn === 'w' ? state.whiteTimeMs : state.blackTimeMs;

    // Persist move to DB
    await this.matchesService.saveMove({
      matchId,
      moveNumber:      state.moveCount,
      san:             moveResult.san,
      fromSq:          from,
      toSq:            to,
      promotion:       promotion,
      fenAfter:        newFen,
      timeRemainingMs,
    });

    // Broadcast the move to both players
    this.server.to(`match:${matchId}`).emit('move:made', {
      san:          moveResult.san,
      from,
      to,
      promotion:    promotion ?? null,
      fen:          newFen,
      pgn:          state.game.pgn(),
      turn:         state.game.turn() === 'w' ? 'white' : 'black',
      whiteTimeMs:  state.whiteTimeMs,
      blackTimeMs:  state.blackTimeMs,
    });

      // Check game-over conditions
      if (state.game.isGameOver()) {
        let result:       'white_wins' | 'black_wins' | 'draw' = 'draw';
        let resultReason: 'checkmate' | 'stalemate'            = 'stalemate';

        if (state.game.isCheckmate()) {
          // The side that just moved wins
          result       = currentTurn === 'w' ? 'white_wins' : 'black_wins';
          resultReason = 'checkmate';
        }
        // stalemate / insufficient material / repetition / 50-move → draw
        await this.endMatch(matchId, state, result, resultReason);
      }
    } catch (error: any) {
      this.logger.error(`Error in handleMove: ${error.message}`);
      client.emit('move:invalid', { reason: error.message || 'Illegal move' });
    }
  }

  // ── RESIGN ────────────────────────────────────────────────────────────────

  @SubscribeMessage('game:resign')
  async handleResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { userId } = client.data;
    const { matchId } = data;

    const state = this.liveMatches.get(matchId);
    if (!state) throw new WsException('Match not found');

    const isWhite = state.whitePlayerId === userId;
    const result  = isWhite ? 'black_wins' : 'white_wins';

    await this.endMatch(matchId, state, result, 'resignation');
  }

  // ── END MATCH ─────────────────────────────────────────────────────────────

  private async endMatch(
    matchId: string,
    state: LiveMatchState,
    result: 'white_wins' | 'black_wins' | 'draw',
    reason: 'checkmate' | 'timeout' | 'resignation' | 'stalemate',
  ) {
    // Stop clock
    if (state.clockInterval) {
      clearInterval(state.clockInterval);
      state.clockInterval = null;
    }

    const pgn = state.game.pgn();

    // Persist to DB
    await this.matchesService.endMatch({
      matchId,
      result,
      resultReason:   reason,
      pgn,
      winnerTimeMs:   result === 'white_wins' ? state.whiteTimeMs : state.blackTimeMs,
      loserTimeMs:    result === 'white_wins' ? state.blackTimeMs : state.whiteTimeMs,
    });

    // Update leaderboard
    await this.leaderboardService.updateAfterMatch(matchId, state.tournamentId);

    // Determine winner name
    let winnerName: string | undefined;
    if (result === 'white_wins') winnerName = state.whitePlayerName;
    else if (result === 'black_wins') winnerName = state.blackPlayerName;

    // Broadcast game over to both players
    this.server.to(`match:${matchId}`).emit('game:over', {
      result,
      reason,
      winnerName,
      pgn,
    });

    // Clean up in-memory state
    this.liveMatches.delete(matchId);
    this.logger.log(`Match ${matchId} ended: ${result} by ${reason}`);
  }

  // ── CLOCK ─────────────────────────────────────────────────────────────────

  private startClockTick(matchId: string) {
    const interval = setInterval(() => {
      const state = this.liveMatches.get(matchId);
      if (!state) { clearInterval(interval); return; }

      let wTime = state.whiteTimeMs;
      let bTime = state.blackTimeMs;
      const elapsed = Date.now() - state.lastMoveAt;

      // Only deduct if a move has actually been made (moveCount > 0) or game strictly started.
      if (state.moveCount > 0) {
        if (state.game.turn() === 'w') {
          wTime = Math.max(0, wTime - elapsed);
        } else {
          bTime = Math.max(0, bTime - elapsed);
        }
      }

      this.server.to(`match:${matchId}`).emit('clock:tick', {
        whiteTimeMs: wTime,
        blackTimeMs: bTime,
      });

      if (wTime === 0 || bTime === 0) {
         clearInterval(interval);
         state.clockInterval = null;
         const result = wTime === 0 ? 'black_wins' : 'white_wins';
         this.endMatch(matchId, state, result, 'timeout');
      }
    }, 1000);

    const state = this.liveMatches.get(matchId);
    if (state) state.clockInterval = interval;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private parseCookies(cookieHeader: string): Record<string, string> {
    if (!cookieHeader) return {};
    return Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, ...rest] = c.trim().split('=');
        return [key.trim(), decodeURIComponent(rest.join('='))];
      }),
    );
  }

  private removeFromAllQueues(socketId: string) {
    for (const [tournamentId, queue] of this.queues.entries()) {
      this.queues.set(
        tournamentId,
        queue.filter((e) => e.socketId !== socketId),
      );
    }
  }
}
