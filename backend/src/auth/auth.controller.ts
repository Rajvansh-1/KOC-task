import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const IS_PROD = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /api/v1/auth/register ────────────────────────────────────────────
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── POST /api/v1/auth/login ───────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.authService.login(dto);

    // httpOnly cookie — JS cannot read this, prevents XSS token theft
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',   // prevents CSRF
      secure:   IS_PROD,    // HTTPS only in production
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path:     '/',
    });

    return user;
  }

  // ── POST /api/v1/auth/logout ──────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ── GET /api/v1/auth/me ───────────────────────────────────────────────────
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
