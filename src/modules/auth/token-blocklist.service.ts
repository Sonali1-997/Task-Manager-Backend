import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TokenBlocklist } from './entities/token-blocklist.entity';

/**
 * Tracks revoked JWTs by their jti until they would expire anyway. Backed by
 * the shared DB so revocation holds across every instance / future service.
 */
@Injectable()
export class TokenBlocklistService {
  constructor(
    @InjectRepository(TokenBlocklist)
    private readonly repo: Repository<TokenBlocklist>,
  ) {}

  /** Revoke a token. Idempotent — re-logging out the same token is a no-op. */
  async block(jti: string, expiresAt: Date): Promise<void> {
    await this.repo.upsert({ jti, expiresAt }, ['jti']);
    // Opportunistic cleanup of rows whose tokens have already expired.
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }

  /** True if the token has been revoked (and not yet naturally expired). */
  async isBlocked(jti: string): Promise<boolean> {
    return (await this.repo.countBy({ jti })) > 0;
  }
}
