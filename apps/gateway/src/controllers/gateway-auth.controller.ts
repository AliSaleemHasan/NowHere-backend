import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { Request } from 'express';
import { extractTokenFromHeader, ReqUser } from 'nowhere-common';
import {
  SigninDTO,
  CreateCredentialDTO,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto';
import {
  AuthPatterns,
  AuthResponse,
  ValidateUserPayload,
  SignupPayload,
  UserDto,
} from 'contracts';
import { Throttle } from '@nestjs/throttler';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';

const LOGIN_THROTTLE = { default: { limit: 5, ttl: 60_000 } } as const;
const PASSWORD_RESET_THROTTLE = {
  default: { limit: 5, ttl: 15 * 60_000 },
} as const;

@ApiTags('auth')
@Controller('auth')
export class GatewayAuthController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in' })
  @Throttle(LOGIN_THROTTLE)
  async login(@Body() body: SigninDTO): Promise<AuthResponse> {
    return this.rpc.request<AuthResponse, ValidateUserPayload>(
      AuthPatterns.VALIDATE_USER,
      body,
      15_000,
    );
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register' })
  @Throttle(LOGIN_THROTTLE)
  async signup(@Body() body: CreateCredentialDTO): Promise<AuthResponse> {
    return this.rpc.request<AuthResponse, SignupPayload>(
      AuthPatterns.SIGNUP,
      body,
      15_000,
    );
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset email',
    description:
      'Always 202 with the same body whether the email exists (no enumeration). Mailhog captures mail in the local compose stack.',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle(PASSWORD_RESET_THROTTLE)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.rpc.request(AuthPatterns.FORGOT_PASSWORD, body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with emailed token' })
  @HttpCode(HttpStatus.OK)
  @Throttle(PASSWORD_RESET_THROTTLE)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.rpc.request(AuthPatterns.RESET_PASSWORD, body);
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBearerAuth()
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
  @ApiOperation({ summary: 'Current JWT user' })
  @ApiBearerAuth()
  @UseGuards(GatewayAuthGuard)
  getMe(@ReqUser() user: UserDto) {
    return user;
  }
}
