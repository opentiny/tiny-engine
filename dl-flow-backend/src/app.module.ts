import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Material, MaterialSchema } from './material/material.schema';
import { Model } from 'mongoose';
import { RedisModule } from '@app/redis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

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
    ]),
    RedisModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly Logger: Logger = new Logger('App');
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    @InjectModel(Material.name)
    private readonly MaterialModel: Model<Material>,
  ) {}
  async onModuleInit() {
    const root = process.cwd();
    const publicPath = join(root, 'public');
    const lock = join(root, 'data', 'install.lock');
    const bundle = join(root, 'data', 'bundle.json');
    if (existsSync(lock)) {
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
    writeFileSync(lock, '1');
  }
}
