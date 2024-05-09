import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DbModule } from '@app/database';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './entities/project.entity';
import { RedisModule } from '@app/redis';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    DbModule,
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
  ],
})
export class ProjectModule {}
