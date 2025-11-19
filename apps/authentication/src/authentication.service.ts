import {
  BadRequestException,
  Injectable,
  Logger,
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
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });

  constructor(
    private jwt: JwtService,
    @InjectRepository(Credential)
    private userRepository: Repository<Credential>,
    private configService: ConfigService,
  ) {}

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

    this.userRepository.save({ ...user, lastLoginAt: new Date() });

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }

    const tokens = await this.generateTokens(user, user.Id);
    return { user, tokens };
  }

  async signup(createUserDto: CreateCredentialDTO) {
    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    let { error: createUserError, data: newUser } = await tryCatch(
      this.craeteUserCredentials(createUserDto),
    );

    if (createUserError || !newUser)
      throw new BadRequestException(
        createUserError?.message || 'User Not Found',
      );

    // let { error, data } = await tryCatch(
    //   this.grpcService.getUserSetting(newUser?.Id),
    // );

    // if (error) throw new BadRequestException(error.message);

    return newUser;
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
