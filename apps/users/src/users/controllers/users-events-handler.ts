import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AuthEvents,
  CreateUserInfoSchema,
  UserCredentialsCreatedEvent,
  validateSchema,
} from 'contracts';
import { JetStreamConsumerService } from 'nowhere-common';
import { UsersService } from '../users.service';

@Injectable()
export class UsersEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(UsersEventsHandler.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jsConsumer: JetStreamConsumerService,
  ) {}

  async onModuleInit() {
    await this.jsConsumer.subscribe({
      stream: 'AUTH_EVENTS',
      consumer: 'users-auth-credentials',
      filterSubject: AuthEvents.USER_CREDENTIALS_CREATED,
      handler: this.handleUserCreated.bind(this),
    });
  }

  private async handleUserCreated(data: UserCredentialsCreatedEvent) {
    this.logger.log(`Handling user credentials created for authId=${data.authId}`);
    const payload = validateSchema(CreateUserInfoSchema, {
      authId: data.authId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      bio: '',
    });
    await this.usersService.createUser({
      ...payload,
      id: payload.authId,
    });
  }
}
