import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('tournaments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // POST /api/v1/tournaments — Coach only
  @Post()
  @Roles('coach')
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: any) {
    return this.tournamentsService.create(dto, user.id);
  }

  // GET /api/v1/tournaments — Both (filtered by role)
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.tournamentsService.findAll(user.role);
  }

  // GET /api/v1/tournaments/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.tournamentsService.findOne(id);
    } catch {
      return null;
    }
  }

  // GET /api/v1/tournaments/:id/participants
  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    try {
      return await this.tournamentsService.getParticipants(id);
    } catch {
      return [];
    }
  }

  // GET /api/v1/tournaments/:id/matches
  @Get(':id/matches')
  async getMatches(@Param('id') id: string) {
    try {
      return await this.tournamentsService.getMatches(id);
    } catch {
      return [];
    }
  }

  // PATCH /api/v1/tournaments/:id — Coach only
  @Patch(':id')
  @Roles('coach')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
    @CurrentUser() user: any,
  ) {
    return this.tournamentsService.update(id, dto, user.id);
  }

  // DELETE /api/v1/tournaments/:id — Coach only
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('coach')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tournamentsService.remove(id, user.id);
  }

  // POST /api/v1/tournaments/:id/join — Student only
  @Post(':id/join')
  @Roles('student')
  join(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tournamentsService.join(id, user.id);
  }
}
