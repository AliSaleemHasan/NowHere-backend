import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { tryCatch } from 'nowhere-common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from 'apps/authentication/src/entities/user-credentials-entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateCredentialDTO } from './dto/create-credential-dto';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });
  private authUsersService: any;

  constructor(
    private jwt: JwtService,
    @InjectRepository(Credential)
    private userRepository: Repository<Credential>,
    private configService: ConfigService,
    @Inject('AUTH_PACKAGE') private client: ClientGrpc,
  ) { }

  onModuleInit() {
    this.authUsersService = this.client.getService('AuthUsers');
  }



  async craeteUserCredentials(createUserDto: CreateCredentialDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }
  async login(email: string, password: string) {
    // first getting the user from the data base
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

    this.userRepository.save({ ...user, lastLoginAt: new Date() });

    const tokens = await this.generateTokens(user, user.Id);
    return { user, tokens };
  }

  async signup(createUserDto: CreateCredentialDTO) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    createUserDto.password = hashedPassword;

    let { error: createUserError, data: newUser } = await tryCatch(
      this.craeteUserCredentials(createUserDto),
    );

    if (createUserError || !newUser)
      throw new BadRequestException(
        createUserError?.message || 'User Not Found',
      );

    // Call Users service to create profile
    try {
      await lastValueFrom(this.authUsersService.createUser({
        ...createUserDto,
        password: hashedPassword, // Send hashed password
        role: 1, // Default to USER role (1)
      }));
    } catch (e) {
      // Rollback credential creation if user creation fails?
      // For now just log error
      this.logger.error('Failed to create user profile in Users service', e);
      // throw new BadRequestException('Failed to create user profile');
    }

    const tokens = await this.generateTokens(newUser, newUser.Id);
    return { user: newUser, tokens };
  }

  // this function is for refreshing the token if
  async refreshToken(token?: string) {
    if (!token) throw new UnauthorizedException('No refresh token provided!');

    // validate the recieved refresh token

    let { error: jwtError, data: payload } = await tryCatch(
      this.jwt.verifyAsync<any>(token, {
        secret: this.configService.get('REFRESH_SECRET'),
      }),
    );

    if (jwtError) throw new UnauthorizedException(jwtError.message);

    let { error, data } = await tryCatch(
      this.generateTokens(payload.user, payload.sub),
    );

    if (error) throw new UnauthorizedException(error.message);
    return { user: payload.user, tokens: data };
  }

  async generateTokens(user: Partial<Credential>, Id: string) {
    const payload = { sub: Id, user };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('ACCESS_SECRET'),
      expiresIn: this.configService.get('ACCESS_EXP'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.configService.get('REFRESH_SECRET'),
      expiresIn: this.configService.get('REFRESH_EXP'),
    });

    return { accessToken, refreshToken };
  }
}
