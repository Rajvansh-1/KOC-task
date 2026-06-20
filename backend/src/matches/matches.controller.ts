import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  async getMatch(@Param('id') id: string) {
    try {
      return await this.matchesService.getMatchDetail(id);
    } catch {
      return null;
    }
  }

  @Get(':id/moves')
  async getMoves(@Param('id') id: string) {
    try {
      return await this.matchesService.getMoves(id);
    } catch {
      return [];
    }
  }
}
