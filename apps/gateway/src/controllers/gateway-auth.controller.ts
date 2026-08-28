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
import { extractTokenFromHeader, ReqUser } from 'nowhere-common';
import { SigninDTO, CreateCredentialDTO } from '../dto';
import { AuthPatterns, AuthResponse, ValidateUserPayload, SignupPayload } from 'contracts';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class GatewayAuthController {
  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  @Post('login')
  async login(@Body() body: SigninDTO): Promise<AuthResponse> {
    return await firstValueFrom(
      this.natsClient.send<AuthResponse, ValidateUserPayload>(
        AuthPatterns.VALIDATE_USER,
        body,
      ),
    );
  }

  @Post('signup')
  async signup(@Body() body: CreateCredentialDTO): Promise<AuthResponse> {
    return await firstValueFrom(
      this.natsClient.send<AuthResponse, SignupPayload>(
        AuthPatterns.SIGNUP,
        body as any,
      ),
    );
  }

  @Get('refresh')
  async refresh(@Req() request: Request): Promise<AuthResponse> {
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    return await firstValueFrom(
      this.natsClient.send<AuthResponse, { token: string }>(
        AuthPatterns.REFRESH_TOKEN,
        { token },
      ),
    );
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  getMe(@ReqUser() user: any) {
    return user;
  }
}
