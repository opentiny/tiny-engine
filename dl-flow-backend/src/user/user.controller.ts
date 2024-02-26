import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDTO, RegisterDTO } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('/login')
  async login(@Body() body: LoginDTO) {
    return {
      jwt: this.userService.login(body),
    };
  }
  @Post('/reg')
  async register(@Body() body: RegisterDTO) {
    return this.userService.register(body);
  }
  @Get(':email')
  async getProfile(@Param('email') email: string) {
    if (!email) {
      throw new HttpException(`${email} not found`, HttpStatus.BAD_REQUEST);
    }
    return this.userService.getProfile(email);
  }
}
