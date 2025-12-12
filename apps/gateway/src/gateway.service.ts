import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GatewayService implements OnModuleInit {
  private credentialsService: any;

  constructor(
    @Inject('CREDENTIALS_PACKAGE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.credentialsService = this.client.getService('Credentials');
  }

  getHello(): string {
    return 'Hello World!';
  }

  async login(data: any) {
    return await lastValueFrom(this.credentialsService.validateAuthUser(data));
  }

  async signup(data: any) {
    return await lastValueFrom(this.credentialsService.signup(data));
  }

  async refresh(token: string) {
    return await lastValueFrom(
      this.credentialsService.refreshToken({ token }),
    );
  }
}
