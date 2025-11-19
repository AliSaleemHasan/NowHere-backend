import { Controller, Post, Body, Req, Get, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { Request } from 'express';
import { SigninDTO } from './dto/signin.dto';
import { extractTokenFromHeader, JwtGuard, ReqUser } from 'nowhere-common';
import { CreateCredentialDTO } from './dto/create-credential-dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  async login(
    @Body('user')
    singinDTO: SigninDTO,
  ) {
    console.log(singinDTO);
    return await this.authService.login(singinDTO.email, singinDTO.password);
  }

  @Post('signup')
  async signup(@Body('user') createUserDTO: CreateCredentialDTO) {
    const data = await this.authService.signup(createUserDTO);
    return data;
  }

  @Get('refresh')
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
