import { Module } from '@nestjs/common';
import { MatchmakingGateway } from './matchmaking.gateway';
import { MatchesModule } from '../matches/matches.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MatchesModule, TournamentsModule, LeaderboardModule, AuthModule],
  providers: [MatchmakingGateway],
})
export class MatchmakingModule {}
