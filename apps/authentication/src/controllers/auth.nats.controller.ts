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
  ChangePasswordSchema,
  validateSchema,
} from 'contracts';
import { AuthenticationService } from '../authentication.service';
import { ChangePasswordService } from '../change-password.service';

@Controller()
export class AuthNatsController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly changePasswordService: ChangePasswordService,
  ) {}

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
    return await this.authService.signup(payload);
  }

  @MessagePattern(AuthPatterns.REFRESH_TOKEN)
  async refreshToken(
    @Payload() data: ValidateTokenPayload,
  ): Promise<AuthResponse> {
    const payload = validateSchema(ValidateTokenSchema, data);
    return await this.authService.refreshToken(payload.token);
  }

  @MessagePattern(AuthPatterns.CHANGE_PASSWORD)
  async changePassword(@Payload() data: unknown) {
    const payload = validateSchema(ChangePasswordSchema, data);
    return await this.changePasswordService.changePassword(payload);
  }
}
