import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';

@Controller('tournaments')
@UseGuards(AuthGuard('jwt'))
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    try {
      return await this.leaderboardService.getLeaderboard(id);
    } catch {
      return [];
    }
  }
}
