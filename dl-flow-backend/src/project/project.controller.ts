import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { Request } from 'express';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  @Get('/')
  async getProjects(@Query('page') page: number) {
    return this.projectService.getProject(page);
  }
  @Get('/:id')
  async getProjectInfo(@Param('id') id?: string) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (Number.isNaN(Number(id))) {
      throw new BadRequestException('id 应该为数字');
    }
    return {
      data: await this.projectService.getProjectInfo(Number(id)),
    };
  }
  @Post('/')
  async create(@Body() body: CreateProjectDto, @Req() req: Request) {
    return {
      data: await this.projectService.create(
        body,
        req.headers.authorization.replace('Bearer', '').trim(),
      ),
    };
  }
  @Patch('/:id')
  async patchProjectInfo(
    @Body() body: UpdateProjectDto,
    @Param('id') id?: string,
  ) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (Number.isNaN(Number(id))) {
      throw new BadRequestException('id 应该为数字');
    }
    return this.projectService.updateProject(Number(id), body);
  }
  @Delete('/:id')
  async deleteProject(@Param('id') id?: string) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (Number.isNaN(Number(id))) {
      throw new BadRequestException('id 应该为数字');
    }
    return this.projectService.deleteProject(Number(id));
  }
  @Post('/restore/:id')
  async restoreProject(@Param('id') id?: string) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (Number.isNaN(Number(id))) {
      throw new BadRequestException('id 应该为数字');
    }
    return this.projectService.restoreProject(Number(id));
  }
}
