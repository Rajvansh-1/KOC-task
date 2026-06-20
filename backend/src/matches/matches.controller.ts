import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  getMatch(@Param('id') id: string) {
    return this.matchesService.getMatchDetail(id);
  }

  @Get(':id/moves')
  getMoves(@Param('id') id: string) {
    return this.matchesService.getMoves(id);
  }
}
