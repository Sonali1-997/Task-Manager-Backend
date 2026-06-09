import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenBlocklist } from './entities/token-blocklist.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlocklistService } from './token-blocklist.service';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([TokenBlocklist]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          // ms-style string ('1d', '15m') or seconds; typed loosely by @nestjs/jwt.
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlocklistService],
  exports: [AuthService],
})
export class AuthModule {}
