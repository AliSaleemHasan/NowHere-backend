import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AuthPatterns,
  ValidateUserPayload,
  ValidateTokenPayload,
  SignupPayload,
  AuthResponse,
  ValidateUserSchema,
  ValidateTokenSchema,
  SignupSchema,
  validateSchema,
} from 'contracts';
import { AuthenticationService } from '../authentication.service';

@Controller()
export class AuthNatsController {
  constructor(private readonly authService: AuthenticationService) {}

  @MessagePattern(AuthPatterns.VALIDATE_USER)
  async validateUser(
    @Payload() data: ValidateUserPayload,
  ): Promise<AuthResponse> {
    const payload = validateSchema(ValidateUserSchema, data);
    return await this.authService.login(payload.email, payload.password);
  }

  @MessagePattern(AuthPatterns.SIGNUP)
  async signup(@Payload() data: SignupPayload): Promise<AuthResponse> {
    const payload = validateSchema(SignupSchema, data);
    return await this.authService.signup(payload as any);
  }

  @MessagePattern(AuthPatterns.REFRESH_TOKEN)
  async refreshToken(
    @Payload() data: ValidateTokenPayload,
  ): Promise<AuthResponse> {
    const payload = validateSchema(ValidateTokenSchema, data);
    return await this.authService.refreshToken(payload.token);
  }
}
