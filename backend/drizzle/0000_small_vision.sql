CREATE TYPE "public"."match_result" AS ENUM('white_wins', 'black_wins', 'draw');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."result_reason" AS ENUM('checkmate', 'timeout', 'resignation', 'stalemate');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'open', 'ongoing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('coach', 'student');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"white_player_id" uuid NOT NULL,
	"black_player_id" uuid NOT NULL,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"result" "match_result",
	"result_reason" "result_reason",
	"pgn" text,
	"fen" text DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' NOT NULL,
	"white_time_remaining_ms" integer NOT NULL,
	"black_time_remaining_ms" integer NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"move_number" integer NOT NULL,
	"san" varchar(10) NOT NULL,
	"from_sq" varchar(2) NOT NULL,
	"to_sq" varchar(2) NOT NULL,
	"promotion" varchar(1),
	"fen_after" text NOT NULL,
	"time_remaining_ms" integer NOT NULL,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_participants_tournament_id_user_id_pk" PRIMARY KEY("tournament_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"points" numeric(5, 1) DEFAULT '0' NOT NULL,
	"buchholz_score" numeric(6, 1) DEFAULT '0' NOT NULL,
	"rank" integer,
	"wins" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"time_control" varchar(20) NOT NULL,
	"start_at" timestamp NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_white_player_id_users_id_fk" FOREIGN KEY ("white_player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_black_player_id_users_id_fk" FOREIGN KEY ("black_player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;