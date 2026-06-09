import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenBlocklistService } from './token-blocklist.service';

/**
 * Transport-agnostic auth logic. It depends only on UserService (the user
 * domain contract) and JwtService — no HTTP/Express types leak in here, so
 * the same service backs an HTTP controller today or a message handler in a
 * microservice later.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly tokenBlocklist: TokenBlocklistService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    // Compare even when the user is missing? We short-circuit, but the
    // generic message below avoids leaking which emails exist.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user);
  }

  /**
   * Revoke the caller's current token. The jti is recorded until the token's
   * own expiry, after which it would be rejected anyway.
   */
  async logout(user: AuthenticatedUser): Promise<{ success: true }> {
    if (user.jti && user.tokenExp) {
      await this.tokenBlocklist.block(user.jti, new Date(user.tokenExp * 1000));
    }
    return { success: true };
  }

  /** Issues a signed token plus a sanitized user view (no password hash). */
  private async buildAuthResult(user: User) {
    const payload: JwtPayload = {
      sub: user.userNo,
      email: user.email,
      role: user.role,
    };

    // jti lets us revoke this specific token on logout.
    const accessToken = await this.jwtService.signAsync(payload, {
      jwtid: randomUUID(),
    });

    return {
      accessToken,
      user: {
        userNo: user.userNo,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
