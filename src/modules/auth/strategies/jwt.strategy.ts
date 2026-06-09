import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';
import { TokenBlocklistService } from '../token-blocklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
    private readonly tokenBlocklist: TokenBlocklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', ''),
    });
  }

  /** Runs after signature/expiry checks pass. Return value becomes request.user. */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Reject tokens revoked via logout.
    if (payload.jti && (await this.tokenBlocklist.isBlocked(payload.jti))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }
    return {
      userNo: user.userNo,
      name: user.name,
      email: user.email,
      role: user.role,
      jti: payload.jti,
      tokenExp: payload.exp,
    };
  }
}
