import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO } from './dto/signin.dto';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('user') singinDTO: SigninDTO) {
    return await this.authService.login(singinDTO.email, singinDTO.password);
  }

  @Post('signup')
  async signup(@Body('user') createUserDTO: CreateUserDTO) {
    //TODO: Handle exception errors on validation (BAD REQUEST EXCEPTION IS APPEREANG)
    //TODO, re add validation with proper messages
    const data = await this.authService.signup(createUserDTO);
    console.log(data);
    return data;
  }

  @Get('validate')
  async validateToken(@Req() request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return await this.authService.verifyJwtToken(token);
  }
}
