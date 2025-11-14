import { Controller, Post, Body, Req, Get, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { Request } from 'express';
import { LoginDocs } from './docs/login.doc';
import { SigninDTO } from './dto/signin.dto';
import { SignupDocs } from './docs/signup.doc';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { RefreshDocs } from './docs/refresh.doc';
import { extractTokenFromHeader, JwtGuard, ReqUser } from 'nowhere-common';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

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
  @UseGuards(JwtGuard)
  async validate(@ReqUser('Id') id: string) {
    return 'valid!';
  }
}
