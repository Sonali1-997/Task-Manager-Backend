import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes by requiring a valid Bearer JWT. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
