import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import { Database } from '../database/database';
import {
  tournaments,
  tournamentParticipants,
  users,
  matches,
} from '../database/schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

/** Parse "5+0" → initial time in ms for each player */
export function parseTimeControlMs(timeControl: string): number {
  const [minutes] = timeControl.split('+').map(Number);
  return minutes * 60 * 1000;
}

@Injectable()
export class TournamentsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────
  async create(dto: CreateTournamentDto, coachId: string) {
    const [tournament] = await this.db
      .insert(tournaments)
      .values({
        name:        dto.name,
        timeControl: dto.timeControl,
        startAt:     new Date(dto.startAt),
        status:      'draft',
        createdBy:   coachId,
      })
      .returning();
    return tournament;
  }

  // ── LIST ────────────────────────────────────────────────────────────────────
  async findAll(role: 'coach' | 'student') {
    const all = await this.db
      .select()
      .from(tournaments)
      .orderBy(desc(tournaments.createdAt));

    // Students only see open / ongoing tournaments
    if (role === 'student') {
      return all.filter((t) => t.status === 'open' || t.status === 'ongoing');
    }
    return all;
  }

  // ── GET ONE ─────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const [t] = await this.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id))
      .limit(1);

    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    return t;
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateTournamentDto, coachId: string) {
    const t = await this.findOne(id);
    if (t.createdBy !== coachId) throw new ForbiddenException('Not your tournament');

    const updates: Partial<typeof tournaments.$inferInsert> = {};
    if (dto.name)        updates.name        = dto.name;
    if (dto.timeControl) updates.timeControl = dto.timeControl;
    if (dto.startAt)     updates.startAt     = new Date(dto.startAt);
    if (dto.status)      updates.status      = dto.status;

    const [updated] = await this.db
      .update(tournaments)
      .set(updates)
      .where(eq(tournaments.id, id))
      .returning();
    return updated;
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  async remove(id: string, coachId: string) {
    const t = await this.findOne(id);
    if (t.createdBy !== coachId) throw new ForbiddenException('Not your tournament');

    await this.db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, id));
    await this.db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // ── JOIN (student self-join) ─────────────────────────────────────────────
  async join(tournamentId: string, userId: string) {
    const t = await this.findOne(tournamentId);
    if (t.status !== 'open') {
      throw new ConflictException('Tournament is not open for joining');
    }

    // Check already joined
    const [existing] = await this.db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      return { message: 'Already a participant' };
    }

    await this.db.insert(tournamentParticipants).values({ tournamentId, userId });
    return { message: 'Joined tournament successfully' };
  }

  // ── IS PARTICIPANT (used by matchmaking) ────────────────────────────────
  async isParticipant(tournamentId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId),
        ),
      )
      .limit(1);
    return !!row;
  }

  // ── PARTICIPANTS LIST ───────────────────────────────────────────────────
  async getParticipants(tournamentId: string) {
    await this.findOne(tournamentId); // 404 guard
    return this.db
      .select({
        id:        users.id,
        name:      users.name,
        email:     users.email,
        joinedAt:  tournamentParticipants.joinedAt,
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
  }

  // ── MATCHES for tournament ──────────────────────────────────────────────
  async getMatches(tournamentId: string) {
    await this.findOne(tournamentId);
    return this.db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(desc(matches.createdAt));
  }
}
