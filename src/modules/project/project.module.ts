import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { Project } from './entities/project.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  // UserModule resolves owner names; TaskModule supplies per-project progress.
  // forwardRef breaks the Project<->Task circular dependency.
  imports: [
    TypeOrmModule.forFeature([Project]),
    UserModule,
    forwardRef(() => TaskModule),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
