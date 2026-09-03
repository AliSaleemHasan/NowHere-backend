import { AuthEvents, AuthResponse, ROLES } from 'contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

function isDuplicateKeyError(error: unknown): boolean {
  if (error instanceof QueryFailedError) {
    const driver = (error as QueryFailedError & {
      driverError?: { code?: string; errno?: number };
    }).driverError;
    return driver?.code === 'ER_DUP_ENTRY' || driver?.errno === 1062;
  }
  const maybe = error as { code?: string; errno?: number; driverError?: { code?: string; errno?: number } };
  return (
    maybe?.code === 'ER_DUP_ENTRY' ||
    maybe?.errno === 1062 ||
    maybe?.driverError?.code === 'ER_DUP_ENTRY' ||
    maybe?.driverError?.errno === 1062
  );
}

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

    await this.jsPublisher.publish<UserCredentialsCreatedEvent>(
      AuthEvents.USER_CREDENTIALS_CREATED,
      {
        authId: savedAdmin.id,
        email: savedAdmin.email,
        firstName: 'admin',
        lastName: 'admin',
      },
    );
  }

  async createUserCredentials(
    createUserDto: Omit<CreateCredentialDTO, 'firstName' | 'lastName' | 'username'> & {
      role: ROLES;
    },
  ) {
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
        role: (result.user.role as ROLES) ?? ROLES.USER,
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

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is disabled');
    }

    await this.userRepository.save({ ...user, lastLoginAt: new Date() });

    const tokens = await this.generateTokens(user, user.id);
    return this.toAuthResponse({ user, tokens });
  }

  async signup(createUserDto: CreateCredentialDTO) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const { error: createUserError, data: newUser } = await tryCatch(
      this.createUserCredentials({
        email: createUserDto.email,
        password: hashedPassword,
        role: ROLES.USER,
      }),
    );

    if (createUserError || !newUser) {
      if (isDuplicateKeyError(createUserError)) {
        throw new ConflictException('Email already in use');
      }
      throw new BadRequestException('Failed to create user credentials');
    }

    await this.jsPublisher.publish<UserCredentialsCreatedEvent>(
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
      this.jwt.verifyAsync<{ sub: string; user?: Partial<Credential> }>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      }),
    );

    if (jwtError || !payload?.sub) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(user, user.id);
    return this.toAuthResponse({ user, tokens });
  }

  async generateTokens(user: Partial<Credential>, Id: string) {
    const userPayload = {
      id: Id,
      email: user.email,
      role: user.role ?? ROLES.USER,
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
