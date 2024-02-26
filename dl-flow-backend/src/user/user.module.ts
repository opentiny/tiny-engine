import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbModule } from '@app/database';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@app/redis';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    DbModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    JwtModule.register({
      publicKey: process.env.JWT_PUB_KEY ?? './static/pub.key',
      privateKey: process.env.JWT_PRI_KEY ?? './static/pri.key',
      signOptions: {
        algorithm: process.env.JWT_SIGN_ALGORITHM,
        expiresIn: process.env.JWT_EXPIRE_IN ?? '24h',
      },
    }),
    RedisModule,
  ],
})
export class UserModule {}
