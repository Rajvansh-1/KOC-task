import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc, and, or } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import { Database } from '../database/database';
import { tournamentResults, matches, users } from '../database/schema';

@Injectable()
export class LeaderboardService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  /**
   * Called after every match ends.
   * 1. Upsert points for both players
   * 2. Recompute Buchholz scores
   * 3. Recompute ranks
   */
  async updateAfterMatch(matchId: string, tournamentId: string) {
    // Load the completed match
    const [match] = await this.db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match || match.status !== 'completed') return;

    const { result, whitePlayerId, blackPlayerId } = match;

    // Standard chess scoring
    const [whitePoints, blackPoints, whiteWin, blackWin, isDraw] =
      result === 'white_wins'
        ? [1, 0, 1, 0, false]
        : result === 'black_wins'
          ? [0, 1, 0, 1, false]
          : [0.5, 0.5, 0, 0, true];

    await this.upsertResult(tournamentId, whitePlayerId, whitePoints, whiteWin === 1, isDraw, !whiteWin && !isDraw);
    await this.upsertResult(tournamentId, blackPlayerId, blackPoints, blackWin === 1, isDraw, !blackWin && !isDraw);

    await this.recomputeBuchholz(tournamentId);
    await this.recomputeRanks(tournamentId);
  }

  private async upsertResult(
    tournamentId: string,
    userId: string,
    points: number,
    isWin: boolean,
    isDraw: boolean,
    isLoss: boolean,
  ) {
    const [existing] = await this.db
      .select()
      .from(tournamentResults)
      .where(
        and(
          eq(tournamentResults.tournamentId, tournamentId),
          eq(tournamentResults.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(tournamentResults)
        .set({
          points:      String(Number(existing.points) + points),
          wins:        existing.wins  + (isWin  ? 1 : 0),
          draws:       existing.draws + (isDraw ? 1 : 0),
          losses:      existing.losses + (isLoss ? 1 : 0),
          gamesPlayed: existing.gamesPlayed + 1,
        })
        .where(
          and(
            eq(tournamentResults.tournamentId, tournamentId),
            eq(tournamentResults.userId, userId),
          ),
        );
    } else {
      await this.db.insert(tournamentResults).values({
        tournamentId,
        userId,
        points:      String(points),
        buchholzScore: '0',
        wins:        isWin  ? 1 : 0,
        draws:       isDraw ? 1 : 0,
        losses:      isLoss ? 1 : 0,
        gamesPlayed: 1,
      });
    }
  }

  /**
   * Buchholz = sum of all opponents' points in this tournament.
   * Re-computed fully after every match to keep it consistent.
   */
  private async recomputeBuchholz(tournamentId: string) {
    const allResults = await this.db
      .select()
      .from(tournamentResults)
      .where(eq(tournamentResults.tournamentId, tournamentId));

    const pointsMap = new Map(allResults.map((r) => [r.userId, Number(r.points)]));

    const allMatches = await this.db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, tournamentId),
          eq(matches.status, 'completed'),
        ),
      );

    // Build opponent list per player
    const opponentMap = new Map<string, string[]>();
    for (const m of allMatches) {
      if (!opponentMap.has(m.whitePlayerId)) opponentMap.set(m.whitePlayerId, []);
      if (!opponentMap.has(m.blackPlayerId))  opponentMap.set(m.blackPlayerId, []);
      opponentMap.get(m.whitePlayerId)!.push(m.blackPlayerId);
      opponentMap.get(m.blackPlayerId)!.push(m.whitePlayerId);
    }

    for (const result of allResults) {
      const opponents = opponentMap.get(result.userId) ?? [];
      const buchholz  = opponents.reduce((sum, oppId) => sum + (pointsMap.get(oppId) ?? 0), 0);

      await this.db
        .update(tournamentResults)
        .set({ buchholzScore: String(buchholz) })
        .where(
          and(
            eq(tournamentResults.tournamentId, tournamentId),
            eq(tournamentResults.userId, result.userId),
          ),
        );
    }
  }

  /** Assign rank 1…N ordered by points DESC, buchholz DESC, wins DESC, name ASC */
  private async recomputeRanks(tournamentId: string) {
    const ordered = await this.db
      .select({ id: tournamentResults.id, userId: tournamentResults.userId })
      .from(tournamentResults)
      .leftJoin(users, eq(tournamentResults.userId, users.id))
      .where(eq(tournamentResults.tournamentId, tournamentId))
      .orderBy(
        desc(tournamentResults.points),
        desc(tournamentResults.buchholzScore),
        desc(tournamentResults.wins),
        asc(users.name),
      );

    for (let i = 0; i < ordered.length; i++) {
      await this.db
        .update(tournamentResults)
        .set({ rank: i + 1 })
        .where(eq(tournamentResults.id, ordered[i].id));
    }
  }

  /** GET /tournaments/:id/leaderboard */
  async getLeaderboard(tournamentId: string) {
    return this.db
      .select({
        rank:         tournamentResults.rank,
        userId:       tournamentResults.userId,
        name:         users.name,
        points:       tournamentResults.points,
        buchholz:     tournamentResults.buchholzScore,
        wins:         tournamentResults.wins,
        draws:        tournamentResults.draws,
        losses:       tournamentResults.losses,
        gamesPlayed:  tournamentResults.gamesPlayed,
      })
      .from(tournamentResults)
      .innerJoin(users, eq(tournamentResults.userId, users.id))
      .where(eq(tournamentResults.tournamentId, tournamentId))
      .orderBy(
        desc(tournamentResults.points),
        desc(tournamentResults.buchholzScore),
        desc(tournamentResults.wins),
        asc(users.name),
      );
  }
}
