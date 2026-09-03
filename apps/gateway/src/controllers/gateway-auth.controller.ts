import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { Request } from 'express';
import { extractTokenFromHeader, ReqUser } from 'nowhere-common';
import { SigninDTO, CreateCredentialDTO } from '../dto';
import {
  AuthPatterns,
  AuthResponse,
  ValidateUserPayload,
  SignupPayload,
  UserDto,
} from 'contracts';
import { Throttle } from '@nestjs/throttler';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';

@Controller('auth')
export class GatewayAuthController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: SigninDTO): Promise<AuthResponse> {
    return this.rpc.request<AuthResponse, ValidateUserPayload>(
      AuthPatterns.VALIDATE_USER,
      body,
      15_000,
    );
  }

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signup(@Body() body: CreateCredentialDTO): Promise<AuthResponse> {
    return this.rpc.request<AuthResponse, SignupPayload>(
      AuthPatterns.SIGNUP,
      body,
      15_000,
    );
  }

  @Get('refresh')
  async refresh(@Req() request: Request): Promise<AuthResponse> {
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    return this.rpc.request<AuthResponse, { token: string }>(
      AuthPatterns.REFRESH_TOKEN,
      { token },
    );
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  getMe(@ReqUser() user: UserDto) {
    return user;
  }
}
