import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  async login() {
    return await this.authService.login();
  }

  @Post('signup')
  async signup() {
    const data = await this.authService.signup();
    return data;
  }

  @Get('refresh')
  async refresh() {
    return await this.authService.refreshToken();
  }

  @Get('validate')
  async validate() {
    return 'valid!';
  }
}
