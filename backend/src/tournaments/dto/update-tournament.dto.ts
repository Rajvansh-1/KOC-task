import { IsString, IsIn, IsDateString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+\+\d+$/, { message: 'timeControl must be in format "5+0" or "3+2"' })
  timeControl?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsIn(['draft', 'open', 'ongoing', 'completed'])
  status?: 'draft' | 'open' | 'ongoing' | 'completed';
}
