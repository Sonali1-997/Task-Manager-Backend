import { UserRole } from '../../../common/enums';

/** Claims carried inside the JWT. `sub` is the UserNo. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  // Standard claims populated by signing: jti (set via jwtid) and exp.
  jti?: string;
  exp?: number;
}

/** Shape attached to request.user after the JWT is validated. */
export interface AuthenticatedUser {
  userNo: string;
  name: string;
  email: string;
  role: UserRole;
  /** This token's id and expiry — needed to revoke it on logout. */
  jti?: string;
  tokenExp?: number;
}
