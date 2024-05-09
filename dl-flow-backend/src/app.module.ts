import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { basename, join } from 'path';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Material, MaterialSchema } from './material/material.schema';
import { Model } from 'mongoose';
import { RedisModule } from '@app/redis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { ProjectModule } from './project/project.module';
import { User, UserSchema } from './user/user.schema';
import { Project, ProjectSchema } from './project/entities/project.entity';
import { isEmpty } from 'ramda';
import { UserService } from './user/user.service';
import { ProjectService } from './project/project.service';

@Module({
  imports: [
    DbModule,
    LayerModule,
    MaterialModule,
    CodeGenerateModule,
    UserModule,
    JwtModule.register({
      global: true,
      publicKey: readFileSync(
        join(process.cwd(), process.env.JWT_PUB_KEY ?? './keys/pub.key'),
      ),
      privateKey: readFileSync(
        join(process.cwd(), process.env.JWT_PRI_KEY ?? './keys/pri.key'),
      ),
      signOptions: {
        algorithm: process.env.JWT_SIGN_ALGORITHM ?? 'RS256',
        expiresIn: process.env.JWT_EXPIRE_IN ?? '1 day',
      },
    }),
    MongooseModule.forFeature([
      {
        name: Material.name,
        schema: MaterialSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
    RedisModule,
    ProjectModule,
  ],
  providers: [UserService, ProjectService],
})
export class AppModule implements OnModuleInit {
  private readonly Logger: Logger = new Logger('App');
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    @InjectModel(Material.name)
    private readonly MaterialModel: Model<Material>,
    @InjectModel(User.name)
    private readonly UserModel: Model<User>,
    @InjectModel(Project.name)
    private readonly ProjectModel: Model<Project>,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
  ) {}
  async onModuleInit() {
    const root = process.cwd();
    const publicPath = join(root, 'public');
    const lock = join(root, 'data', 'install.lock');
    const bundle = join(root, 'data', 'bundle.json');
    const examplePath = join(root, 'examples');
    if (existsSync(lock) && !__DEV__) {
      this.Logger.log('Lock file exists');
      return;
    }
    if (!existsSync(bundle)) {
      this.Logger.warn('bundle.json not exists');
    }
    if (existsSync(bundle)) {
      this.Logger.log('bundle.json exists');
      const { data } = JSON.parse(readFileSync(bundle).toString());
      const types = data.types;
      const materials = data.materials;
      if (types) {
        this.Logger.log('Insert types');
        try {
          for (const [key, value] of Object.entries(types)) {
            await this.redis.hset('types', { [key]: JSON.stringify(value) });
          }
        } catch (err) {
          const e = err as Error;
          this.Logger.error('Insert types fail', e.stack);
          process.exit(-1);
        }
      }
      if (materials) {
        this.Logger.log('Insert materials');
        try {
          await this.MaterialModel.insertMany(materials);
        } catch (err) {
          const e = err as Error;
          this.Logger.error('Insert Materials fail', e.stack);
          process.exit(-1);
        }
      }
    }
    if (!existsSync(publicPath)) {
      mkdirSync(publicPath);
    }
    const adminUser = await this.UserModel.findOne({
      email: 'admin@no-reply.com',
    });
    let profile;
    let token;
    if (!adminUser) {
      this.Logger.warn('Not find admin user');
      profile = await this.userService.register({
        email: 'admin@no-reply.com',
        nick: 'Admin',
        password: 'admin',
      });
      token = (
        await this.userService.login({
          email: 'admin@no-reply.com',
          password: 'admin',
        })
      ).jwt;
      this.Logger.log('Create Admin user success');
    }
    if (existsSync(examplePath)) {
      const examples = readdirSync(examplePath).map((fileName) => {
        return [basename(fileName, '.json'), join(examplePath, fileName)];
      });

      for (const [exampleName, examplePath] of examples) {
        this.Logger.log(`Insert ${exampleName} example`);
        const content = JSON.parse(readFileSync(examplePath).toString());
        if (!isEmpty(content['data']) && !isEmpty(content['graphData'])) {
          const { projectId } = await this.projectService.create(
            { name: exampleName },
            token,
          );
          await this.projectService.updateProject(projectId, {
            ...content,
          });
          this.Logger.log(`Insert ${exampleName} success`);
        } else {
          this.Logger.warn(`Example should contain data and graphdata`);
        }
      }
    }
    writeFileSync(lock, '1');
  }
}
