import { IsEmail, IsString } from 'class-validator';

export class LoginDTO {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

export class RegisterDTO {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
  @IsString()
  nick: string;
}

export class GetProfileDTO {
  @IsEmail()
  email: string;
}
