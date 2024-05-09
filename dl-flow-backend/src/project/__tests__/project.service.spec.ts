import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../project.service';
import { DbModule } from '@app/database';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../entities/project.entity';
import { RedisModule } from '@app/redis';
import { UserService } from '../../user/user.service';
import { User, UserSchema } from '../../user/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { configDotenv } from 'dotenv';

describe('ProjectService', () => {
  let service: ProjectService;
  let userService: UserService;
  let token = '';

  beforeAll(async () => {
    configDotenv({
      path: '.env',
    });
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule,
        MongooseModule.forFeature([
          {
            name: Project.name,
            schema: ProjectSchema,
          },
          {
            name: User.name,
            schema: UserSchema,
          },
        ]),
        RedisModule,
        JwtModule.register({
          secret: 'test',
          signOptions: {
            algorithm: 'none',
            expiresIn: process.env.JWT_EXPIRE_IN ?? '24h',
          },
        }),
      ],
      providers: [ProjectService, UserService],
    }).compile();
    service = module.get<ProjectService>(ProjectService);
    userService = module.get<UserService>(UserService);
    await userService.register({
      nick: 'test-1',
      password: '123456789Sd!',
      email: 'test@no-reply.com',
    });
    token = await userService.login({
      email: 'test@no-reply.com',
      password: '123456789Sd!',
    });
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
    expect(await service.create({ name: 'test' }, token)).toBeDefined();
  }, 60 * 1000);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('create(exists)', () => {
    expect(service.create({ name: 'test' }, token)).rejects.toThrow();
  });
  it('getProject', (done) => {
    const p1 = service.getProject(0, 10).then(({ projects }) => {
      expect(projects).toHaveLength(1);
    });
    const p2 = service.getProject(1, 10).then(({ projects }) => {
      expect(projects).toHaveLength(0);
    });
    const p3 = service.getProject(-1, 10).then(({ projects }) => {
      expect(projects).toHaveLength(1);
    });
    const p4 = service.getProject(0, 100).then(({ projects }) => {
      expect(projects).toHaveLength(1);
    });
    Promise.all([p1, p2, p3, p4]).then(() => {
      done();
    });
  });
  it('updateProject', () => {
    expect(service.updateProject(1, { name: 'test-1' })).resolves.toBeDefined();
  });
  it('delete project', () => {
    expect(service.deleteProject(1)).resolves.toBeTruthy();
  });
  it('restore project', () => {
    expect(service.restoreProject(1)).resolves.toBeTruthy();
  });
});
