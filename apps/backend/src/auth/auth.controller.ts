import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO } from './dto/signin.dto';
import { Request } from 'express';
import { extractTokenFromHeader } from 'common/utils/extract-authorization-header';

import { LoginDocs } from './docs/login.doc';
import { SignupDocs } from './docs/signup.doc';
import { RefreshDocs } from './docs/refresh.doc';
import { ValidateDocs } from './docs/validate.doc';
import { CreateUserDTO } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @LoginDocs()
  async login(
    @Body('user')
    singinDTO: SigninDTO,
  ) {
    return await this.authService.login(singinDTO.email, singinDTO.password);
  }

  @Post('signup')
  @SignupDocs()
  async signup(@Body('user') createUserDTO: CreateUserDTO) {
    const data = await this.authService.signup(createUserDTO);
    return data;
  }

  @Get('refresh')
  @RefreshDocs()
  async refresh(@Req() request: Request) {
    const token = extractTokenFromHeader(request);
    return await this.authService.refreshToken(token);
  }

  @Get('validate')
  @ValidateDocs()
  async validateToken(@Req() request: Request) {
    const token = extractTokenFromHeader(request);
    return await this.authService.validateToken(token);
  }
}
