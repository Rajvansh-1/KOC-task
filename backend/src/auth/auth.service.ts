import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DATABASE_TOKEN } from '../database/database.module';
import { Database } from '../database/database';
import { users } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: 'coach' | 'student';
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check for duplicate email
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email:        dto.email,
        passwordHash,
        name:         dto.name,
        role:         dto.role,
      })
      .returning({
        id:        users.id,
        email:     users.email,
        name:      users.name,
        role:      users.role,
        createdAt: users.createdAt,
      });

    return user;
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub:   user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id:    user.id,
        email: user.email,
        name:  user.name,
        role:  user.role,
      },
    };
  }

  async findById(id: string) {
    const [user] = await this.db
      .select({
        id:        users.id,
        email:     users.email,
        name:      users.name,
        role:      users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }
}
