import { InjectRedis } from '@liaoliaots/nestjs-redis';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Redis } from 'ioredis';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    @InjectRedis()
    private redis: Redis,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(req);
    try {
      this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException();
    }
    // 如果redis中不存在token, 那么也提示未登陆错误
    if (!Boolean(await this.redis.exists(token))) {
      throw new UnauthorizedException();
    }
    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
