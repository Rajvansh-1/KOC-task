import { IsString, MinLength, MaxLength, Matches, IsDateString } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  /**
   * Time control format: "<minutes>+<increment>" e.g. "5+0", "3+2", "10+5"
   * minutes = per player time, increment = seconds added per move
   */
  @IsString()
  @Matches(/^\d+\+\d+$/, { message: 'timeControl must be in format "5+0" or "3+2"' })
  timeControl: string;

  @IsDateString()
  startAt: string;
}
