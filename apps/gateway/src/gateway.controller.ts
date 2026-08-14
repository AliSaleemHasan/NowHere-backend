import { Controller, Get, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { AuthGuard } from './guards/auth.guard';
import { Request } from 'express';

import { extractTokenFromHeader } from 'nowhere-common';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  getHello(): string {
    return this.gatewayService.getHello();
  }

  @Post('auth/login')
  async login(@Body() body: any) {
    return await this.gatewayService.login(body);
  }

  @Post('auth/signup')
  async signup(@Body() body: any) {
    return await this.gatewayService.signup(body);
  }

  @Get('auth/refresh')
  async refresh(@Req() request: Request) {
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    return await this.gatewayService.refresh(token);
  }

  @Get('users/me')
  @UseGuards(AuthGuard)
  async getMe(@Req() request: any) {
    return request.user;
  }
}
