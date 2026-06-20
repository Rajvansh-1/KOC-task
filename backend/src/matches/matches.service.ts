import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, or, and, desc } from 'drizzle-orm';
import { Chess } from 'chess.js';
import { DATABASE_TOKEN } from '../database/database.module';
import { Database } from '../database/database';
import { matches, moves, users, tournaments } from '../database/schema';
import { parseTimeControlMs } from '../tournaments/tournaments.service';

export interface MatchWithPlayers {
  id: string;
  tournamentId: string;
  whitePlayer: { id: string; name: string };
  blackPlayer: { id: string; name: string };
  status: string;
  result: string | null;
  resultReason: string | null;
  fen: string;
  pgn: string | null;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  startedAt: Date | null;
  endedAt: Date | null;
}

@Injectable()
export class MatchesService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  /** Create a new match when matchmaking pairs two players */
  async createMatch(
    tournamentId: string,
    whitePlayerId: string,
    blackPlayerId: string,
  ) {
    // Get time control from tournament
    const [tournament] = await this.db
      .select({ timeControl: tournaments.timeControl })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    const timeMs = tournament
      ? parseTimeControlMs(tournament.timeControl)
      : 5 * 60 * 1000; // default 5 min

    const [match] = await this.db
      .insert(matches)
      .values({
        tournamentId,
        whitePlayerId,
        blackPlayerId,
        status: 'active',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        whiteTimeRemainingMs: timeMs,
        blackTimeRemainingMs: timeMs,
        startedAt: new Date(),
      })
      .returning();

    // Transition tournament to 'ongoing' if still 'open'
    await this.db
      .update(tournaments)
      .set({ status: 'ongoing' })
      .where(
        and(
          eq(tournaments.id, tournamentId),
          eq(tournaments.status, 'open'),
        ),
      );

    return match;
  }

  /** Find a match by id, throws 404 if not found */
  async findById(matchId: string) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    return match;
  }

  /** Find active match for a user (used as concurrency guard in matchmaking) */
  async findActiveMatchForUser(userId: string) {
    const [match] = await this.db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.status, 'active'),
          or(
            eq(matches.whitePlayerId, userId),
            eq(matches.blackPlayerId, userId),
          ),
        ),
      )
      .limit(1);
    return match ?? null;
  }

  /** Save a move to the DB and update match FEN */
  async saveMove(params: {
    matchId: string;
    moveNumber: number;
    san: string;
    fromSq: string;
    toSq: string;
    promotion?: string;
    fenAfter: string;
    timeRemainingMs: number;
  }) {
    await this.db.insert(moves).values({
      matchId:         params.matchId,
      moveNumber:      params.moveNumber,
      san:             params.san,
      fromSq:          params.fromSq,
      toSq:            params.toSq,
      promotion:       params.promotion ?? null,
      fenAfter:        params.fenAfter,
      timeRemainingMs: params.timeRemainingMs,
    });

    await this.db
      .update(matches)
      .set({ fen: params.fenAfter })
      .where(eq(matches.id, params.matchId));
  }

  /** End a match — saves result, PGN, timestamps */
  async endMatch(params: {
    matchId: string;
    result: 'white_wins' | 'black_wins' | 'draw';
    resultReason: 'checkmate' | 'timeout' | 'resignation' | 'stalemate';
    pgn: string;
    winnerTimeMs: number;
    loserTimeMs: number;
  }) {
    const [match] = await this.db
      .update(matches)
      .set({
        status:       'completed',
        result:       params.result,
        resultReason: params.resultReason,
        pgn:          params.pgn,
        endedAt:      new Date(),
      })
      .where(eq(matches.id, params.matchId))
      .returning();

    return match;
  }

  /** Get match with player names for state broadcasts */
  async findByIdWithPlayers(matchId: string): Promise<MatchWithPlayers> {
    const match = await this.findById(matchId);

    const [white] = await this.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, match.whitePlayerId))
      .limit(1);

    const [black] = await this.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, match.blackPlayerId))
      .limit(1);

    return {
      id:                  match.id,
      tournamentId:        match.tournamentId,
      whitePlayer:         white ?? { id: match.whitePlayerId, name: 'Unknown' },
      blackPlayer:         black ?? { id: match.blackPlayerId, name: 'Unknown' },
      status:              match.status,
      result:              match.result ?? null,
      resultReason:        match.resultReason ?? null,
      fen:                 match.fen,
      pgn:                 match.pgn ?? null,
      whiteTimeRemainingMs: match.whiteTimeRemainingMs,
      blackTimeRemainingMs: match.blackTimeRemainingMs,
      startedAt:           match.startedAt,
      endedAt:             match.endedAt,
    };
  }

  /** Get all moves for a match (for move navigation / replay) */
  async getMoves(matchId: string) {
    return this.db
      .select()
      .from(moves)
      .where(eq(moves.matchId, matchId))
      .orderBy(moves.moveNumber);
  }

  /** REST: GET /matches/:id */
  async getMatchDetail(matchId: string) {
    const match  = await this.findByIdWithPlayers(matchId);
    const moveList = await this.getMoves(matchId);
    return { match, moves: moveList };
  }
}
