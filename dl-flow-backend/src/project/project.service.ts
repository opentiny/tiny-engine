import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Project } from './entities/project.entity';
import { Model } from 'mongoose';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { User } from '../user/user.schema';

enum ProjectStatus {
  busy,
  empty,
}

interface ProjectItem {
  // project name
  name: string;
  status: ProjectStatus;
  author: {
    nick: string;
  };
  createAt: string;
  id: number;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private ProjectModel: Model<Project>,
    @InjectRedis()
    private redis: Redis,
  ) {}
  private async projectExists(name: string) {
    const res = await this.ProjectModel.findOne({ name });
    return Boolean(res);
  }
  async create({ name }: CreateProjectDto, token: string) {
    if (await this.projectExists(name)) {
      throw new HttpException(`${name} 存在`, HttpStatus.BAD_REQUEST);
    }
    const email = await this.redis.get(`${token}:id`);
    if (!email) {
      throw new HttpException(`未登录`, HttpStatus.UNAUTHORIZED);
    }
    const project = new this.ProjectModel();
    const id = Number((await this.redis.get(`project:counter`)) ?? '1');
    project.projectId = id;
    project.name = name;
    project.createAt = new Date().getTime();
    project.author = email;
    project.removed = false;
    const res = await project.save();
    if (!(await this.redis.get('project:counter'))) {
      await this.redis.set('project:counter', 1);
      return res;
    }
    await this.redis.incr('project:counter');
    return res;
  }
  async getProject(page = 0, size = 10) {
    const totalPages = Math.round(
      Number(await this.redis.get(`project:counter`)) / size,
    );
    const projects = await this.ProjectModel.find({ removed: false })
      .limit(size)
      .skip(Math.max(page, 0) * size)
      .populate('author', 'nick', User.name);
    return {
      projects,
      totalPages,
    };
  }
  async getProjectInfo(id: number) {
    return this.ProjectModel.findOne({ projectId: id });
  }
  async deleteProject(id: number) {
    await this.ProjectModel.updateOne({ projectId: id }, { removed: true });
    return true;
  }
  async restoreProject(id: number) {
    await this.ProjectModel.updateOne({ projectId: id }, { removed: false });
    return true;
  }
  async updateProject(id: number, newProjectInfo: UpdateProjectDto) {
    return await this.ProjectModel.updateOne(
      { projectId: id },
      {
        ...newProjectInfo,
      },
    );
  }
}
