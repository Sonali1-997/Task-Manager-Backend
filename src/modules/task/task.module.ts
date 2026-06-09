import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    // Tasks authorize against projects and validate assignees against users.
    // These are domain-service dependencies (later: remote service clients).
    // forwardRef: ProjectService also consumes TaskService (for progress).
    forwardRef(() => ProjectModule),
    UserModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
