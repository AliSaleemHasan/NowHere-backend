import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { GrpcService } from '../grpc/grpc.service';
import { tryCatch } from 'nowhere-common';
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name, {
    timestamp: true,
  });

  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    private grpcService: GrpcService,
  ) {}

  async login(email: string, password: string) {
    // first getting the user from the data base
    const user = await this.usersService.getUserByEmail(email);

    if (!user)
      throw new UnauthorizedException('User not found, please sign up');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Wrong password');
    }

    const tokens = await this.generateTokens(user, user.Id);
    return { user, tokens };
  }

  async signup(createUserDto: CreateUserDTO) {
    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

    let { error: createUserError, data: newUser } = await tryCatch(
      this.usersService.createUser(createUserDto),
    );
    if (createUserError || !newUser)
      throw new BadRequestException(
        createUserError?.message || 'User Not Found',
      );

    let { error, data } = await tryCatch(
      this.grpcService.getUserSetting(newUser?.Id),
    );

    if (error) throw new BadRequestException(error.message);

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

  async generateTokens(user: Partial<User>, Id: string) {
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
