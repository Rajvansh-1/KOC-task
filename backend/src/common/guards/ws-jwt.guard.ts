import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key.trim(), decodeURIComponent(rest.join('='))];
    }),
  );
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Extract JWT from cookie header on WebSocket handshake
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const cookies      = parseCookies(cookieHeader);
    const token        = cookies['jwt'];

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'koc_dev_secret_change_in_production_2026',
      });

      // Attach user to socket data for use in event handlers
      client.data.userId = payload.sub;
      client.data.role   = payload.role;
      client.data.name   = payload.name;
      client.data.email  = payload.email;

      return true;
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }
}
