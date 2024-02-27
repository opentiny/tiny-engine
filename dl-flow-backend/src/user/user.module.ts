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
    RedisModule,
  ],
})
export class UserModule {}
