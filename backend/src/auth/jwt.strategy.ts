import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './auth.service';

// Extract JWT from httpOnly cookie
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.['jwt'] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'koc_dev_secret_change_in_production_2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    // Return value is attached to req.user
    return {
      id:    payload.sub,
      email: payload.email,
      name:  payload.name,
      role:  payload.role,
    };
  }
}
