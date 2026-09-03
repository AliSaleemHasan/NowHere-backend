import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { Request } from 'express';
import { extractTokenFromHeader, ReqUser, natsRequest } from 'nowhere-common';
import { SigninDTO, CreateCredentialDTO } from '../dto';
import {
  AuthPatterns,
  AuthResponse,
  ValidateUserPayload,
  SignupPayload,
} from 'contracts';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class GatewayAuthController {
  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: SigninDTO): Promise<AuthResponse> {
    return await natsRequest<AuthResponse, ValidateUserPayload>(
      this.natsClient,
      AuthPatterns.VALIDATE_USER,
      body,
      15_000,
    );
  }

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signup(@Body() body: CreateCredentialDTO): Promise<AuthResponse> {
    return await natsRequest<AuthResponse, SignupPayload>(
      this.natsClient,
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
    return await natsRequest<AuthResponse, { token: string }>(
      this.natsClient,
      AuthPatterns.REFRESH_TOKEN,
      { token },
    );
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  getMe(@ReqUser() user: any) {
    return user;
  }
}
