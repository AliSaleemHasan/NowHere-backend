import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });

  constructor() {}

  async login() {
    return 'Test Login ';
  }

  async signup() {
    return 'Test SignUp';
  }

  async refreshToken() {
    return 'Test Refresh';
  }

  async generateTokens() {
    return 'Test Generate';
  }
}
