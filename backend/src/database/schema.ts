import { pgTable, uuid, varchar, text, timestamp, integer, decimal, primaryKey, pgEnum } from 'drizzle-orm/pg-core';

// ── Enums ─────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['coach', 'student']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['draft', 'open', 'ongoing', 'completed']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'active', 'completed']);
export const matchResultEnum = pgEnum('match_result', ['white_wins', 'black_wins', 'draw']);
export const resultReasonEnum = pgEnum('result_reason', ['checkmate', 'timeout', 'resignation', 'stalemate']);

// ── Tables ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name:         varchar('name', { length: 100 }).notNull(),
  role:         userRoleEnum('role').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export const tournaments = pgTable('tournaments', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 200 }).notNull(),
  timeControl: varchar('time_control', { length: 20 }).notNull(), // "5+0", "3+2"
  startAt:     timestamp('start_at').notNull(),
  status:      tournamentStatusEnum('status').default('draft').notNull(),
  createdBy:   uuid('created_by').references(() => users.id).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const tournamentParticipants = pgTable('tournament_participants', {
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  userId:       uuid('user_id').references(() => users.id).notNull(),
  joinedAt:     timestamp('joined_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.tournamentId, t.userId] })]);

export const matches = pgTable('matches', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tournamentId:         uuid('tournament_id').references(() => tournaments.id).notNull(),
  whitePlayerId:        uuid('white_player_id').references(() => users.id).notNull(),
  blackPlayerId:        uuid('black_player_id').references(() => users.id).notNull(),
  status:               matchStatusEnum('status').default('pending').notNull(),
  result:               matchResultEnum('result'),
  resultReason:         resultReasonEnum('result_reason'),
  pgn:                  text('pgn'),
  fen:                  text('fen').default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1').notNull(),
  whiteTimeRemainingMs: integer('white_time_remaining_ms').notNull(),
  blackTimeRemainingMs: integer('black_time_remaining_ms').notNull(),
  startedAt:            timestamp('started_at'),
  endedAt:              timestamp('ended_at'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
});

export const moves = pgTable('moves', {
  id:              uuid('id').primaryKey().defaultRandom(),
  matchId:         uuid('match_id').references(() => matches.id).notNull(),
  moveNumber:      integer('move_number').notNull(),
  san:             varchar('san', { length: 10 }).notNull(),
  fromSq:          varchar('from_sq', { length: 2 }).notNull(),
  toSq:            varchar('to_sq', { length: 2 }).notNull(),
  promotion:       varchar('promotion', { length: 1 }),
  fenAfter:        text('fen_after').notNull(),
  timeRemainingMs: integer('time_remaining_ms').notNull(),
  playedAt:        timestamp('played_at').defaultNow().notNull(),
});

export const tournamentResults = pgTable('tournament_results', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tournamentId:  uuid('tournament_id').references(() => tournaments.id).notNull(),
  userId:        uuid('user_id').references(() => users.id).notNull(),
  points:        decimal('points', { precision: 5, scale: 1 }).default('0').notNull(),
  buchholzScore: decimal('buchholz_score', { precision: 6, scale: 1 }).default('0').notNull(),
  rank:          integer('rank'),
  wins:          integer('wins').default(0).notNull(),
  draws:         integer('draws').default(0).notNull(),
  losses:        integer('losses').default(0).notNull(),
  gamesPlayed:   integer('games_played').default(0).notNull(),
});

// ── Type Exports ──────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Move = typeof moves.$inferSelect;
export type TournamentResult = typeof tournamentResults.$inferSelect;
