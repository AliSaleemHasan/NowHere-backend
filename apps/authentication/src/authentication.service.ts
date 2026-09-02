import { AuthEvents, AuthResponse, ROLES } from 'contracts';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JetStreamPublisher, tryCatch } from 'nowhere-common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from './entities/user-credentials-entity';
import { QueryFailedError, Repository } from 'typeorm';
import { UserCredentialsCreatedEvent } from 'contracts';
import { CreateCredentialDTO } from 'nowhere-common/dto/authentication/create-credential-dto';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });

  constructor(
    private jwt: JwtService,
    @InjectRepository(Credential)
    private userRepository: Repository<Credential>,
    private configService: ConfigService,
    private jsPublisher: JetStreamPublisher,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.log(
        'Admin email and password are not provided , continuing without admin!',
      );
      return;
    }

    const existingAdmin = await this.userRepository.findOneBy({ email });
    if (existingAdmin) {
      this.logger.log('Admin credentials already exist, skipping seeding.');
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      role: ROLES.ADMIN,
    });

    const savedAdmin = await this.userRepository.save(admin);
    this.logger.log(`Admin credentials seeded with ID: ${savedAdmin.id}`);

    // Emit event so Users service creates the user profile asynchronously
    await this.jsPublisher.publish(
      AuthEvents.USER_CREDENTIALS_CREATED,
      {
        authId: savedAdmin.id,
        email: savedAdmin.email,
        firstName: 'admin',
        lastName: 'admin',
      },
    );
  }

  async createUserCredentials(createUserDto: CreateCredentialDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  private toAuthResponse(result: {
    user: Partial<Credential>;
    tokens: { accessToken: string; refreshToken: string };
  }): AuthResponse {
    return {
      user: {
        id: result.user.id as string,
        email: result.user.email as string,
        role: result.user.role as any,
        isActive: result.user.isActive as boolean,
        lastLoginAt: result.user.lastLoginAt,
      },
      tokens: result.tokens,
    };
  }

  async login(email: string, password: string) {
    const { error, data: user } = await tryCatch(
      this.userRepository.findOneBy({ email }),
    );

    if (error) {
      throw new QueryFailedError('get user by email', undefined, error);
    }

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }

    await this.userRepository.save({ ...user, lastLoginAt: new Date() });

    const tokens = await this.generateTokens(user, user.id);
    return this.toAuthResponse({ user, tokens });
  }

  async signup(createUserDto: CreateCredentialDTO) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    createUserDto.password = hashedPassword;

    if (typeof createUserDto.role === 'number') {
      createUserDto.role = createUserDto.role === 0 ? ROLES.ADMIN : ROLES.USER;
    }

    const { error: createUserError, data: newUser } = await tryCatch(
      this.createUserCredentials(createUserDto),
    );

    if (createUserError || !newUser)
      throw new BadRequestException(
        createUserError?.message || 'Failed to create user credentials',
      );

    // Publish durable event via NATS JetStream
    await this.jsPublisher.publish(
      AuthEvents.USER_CREDENTIALS_CREATED,
      {
        authId: newUser.id,
        email: newUser.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
    );

    const tokens = await this.generateTokens(newUser, newUser.id);
    return this.toAuthResponse({ user: newUser, tokens });
  }

  async refreshToken(token?: string) {
    if (!token) throw new UnauthorizedException('No refresh token provided!');

    const { error: jwtError, data: payload } = await tryCatch(
      this.jwt.verifyAsync<any>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      }),
    );

    if (jwtError) throw new UnauthorizedException(jwtError.message);

    const { error, data } = await tryCatch(
      this.generateTokens(payload.user, payload.sub),
    );

    if (error) throw new UnauthorizedException(error.message);
    return this.toAuthResponse({ user: payload.user, tokens: data });
  }

  async generateTokens(user: Partial<Credential>, Id: string) {
    const userPayload = {
      id: Id,
      email: user.email,
      role: user.role,
    };
    const payload = { sub: Id, user: userPayload };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('ACCESS_SECRET'),
      expiresIn: this.configService.get('ACCESS_EXP') || '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXP') || '7d',
    });

    return { accessToken, refreshToken };
  }
}
