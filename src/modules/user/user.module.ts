import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  // Exported so AuthModule can consume the domain service. When this module
  // becomes a standalone microservice, swap UserService for a client proxy
  // and the consumers stay unchanged.
  exports: [UserService],
})
export class UserModule {}
