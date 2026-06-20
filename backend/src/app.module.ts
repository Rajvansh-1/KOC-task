import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchesModule } from './matches/matches.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TournamentsModule,
    MatchesModule,
    MatchmakingModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
