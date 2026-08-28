import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthPatterns, ValidateUserPayload, ValidateTokenPayload, SignupPayload, AuthResponse } from 'contracts';
import { AuthenticationService } from '../authentication.service';

@Controller()
export class AuthNatsController {
  constructor(private readonly authService: AuthenticationService) {}

  @MessagePattern(AuthPatterns.VALIDATE_USER)
  async validateUser(@Payload() data: ValidateUserPayload): Promise<AuthResponse> {
    return await this.authService.login(data.email, data.password);
  }

  @MessagePattern(AuthPatterns.SIGNUP)
  async signup(@Payload() data: SignupPayload): Promise<AuthResponse> {
    return await this.authService.signup(data as any);
  }

  @MessagePattern(AuthPatterns.REFRESH_TOKEN)
  async refreshToken(@Payload() data: ValidateTokenPayload): Promise<AuthResponse> {
    return await this.authService.refreshToken(data.token);
  }
}
