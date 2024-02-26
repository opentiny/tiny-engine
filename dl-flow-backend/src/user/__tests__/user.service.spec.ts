import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { DbModule } from '@app/database';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user.schema';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@app/redis';
import { configDotenv } from 'dotenv';
import { readFileSync } from 'fs';
import { HttpException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    configDotenv({
      path: '.env',
    });
    const module: TestingModule = await Test.createTestingModule({
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
          publicKey: readFileSync(
            process.env.JWT_PUB_KEY ?? './static/pub.key',
          ),
          privateKey: readFileSync(
            process.env.JWT_PRI_KEY ?? './static/pri.key',
          ),
          signOptions: {
            algorithm: process.env.JWT_SIGN_ALGORITHM,
            expiresIn: process.env.JWT_EXPIRE_IN ?? '24h',
          },
        }),
        RedisModule,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    await service.register({
      email: 'test@no-reply.com',
      password: '123456789Sd!',
      nick: 'tester-1',
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('login', () => {
    expect(
      service.login({ email: 'test@no-reply.com', password: '123456789Sd!' }),
    ).resolves.not.toBe('');
    expect(
      service.login({ email: 'test_@no-reply.com', password: '123456789Sd!' }),
    ).rejects.toThrowError(HttpException);
    expect(
      service.login({ email: 'test@no-reply.com', password: '123456789Sd' }),
    ).rejects.toThrowError(HttpException);
    expect(
      service.login({ email: 'test_@no-reply.com', password: '123456789Sd' }),
    ).rejects.toThrowError(HttpException);
  });
  it('register', () => {
    expect(
      service.register({
        email: '_test@no-reply.com',
        password: '123456789Sd!',
        nick: 'nick-2',
      }),
    ).resolves.toBeDefined();
    expect(
      service.register({
        email: 'test@no-reply.com',
        password: '123456789Sd!',
        nick: 'tester-1',
      }),
    ).rejects.toThrowError(HttpException);
  });
  it('profile', () => {
    expect(service.getProfile('test@no-reply.com')).resolves.toMatchObject({
      email: 'test@no-reply.com',
      nick: 'tester-1',
    });
  });
});
