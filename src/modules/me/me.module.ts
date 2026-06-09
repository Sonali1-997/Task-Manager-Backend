import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { MeController } from './me.controller';

@Module({
  // Aggregates the task, project, and user domain services for personal views.
  imports: [TaskModule, ProjectModule, UserModule],
  controllers: [MeController],
})
export class MeModule {}
