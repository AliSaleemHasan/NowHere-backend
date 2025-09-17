import { Controller } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUTH_USERS_SERVICE_NAME,
  AuthUsersController,
  CreateUserDTO as ProtoCreateUserDto,
  GetUserSettingsDTO,
  Settings,
  User,
  ValidateTokenDto,
  ValidateUserDto,
  Users,
  type Empty,
} from 'proto';
import { mapUserToProto } from './mappers/user-mappers';

@Controller()
export class GrpcController implements AuthUsersController {
  constructor(private readonly grpcService: GrpcService) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, 'createUser')
  async createUser(request: ProtoCreateUserDto): Promise<User> {
    return mapUserToProto(await this.grpcService.createUser(request));
  }

  @GrpcMethod(AUTH_USERS_SERVICE_NAME)
  async validateUser(validateUserDto: ValidateUserDto): Promise<User> {
    return await this.grpcService.validateUser(validateUserDto);
  }

  @GrpcMethod(AUTH_USERS_SERVICE_NAME)
  async validateToken(request: ValidateTokenDto): Promise<User> {
    return await this.grpcService.validateToken(request.token);
  }

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, 'getUserSetting')
  async getUserSetting(getUserSettings: GetUserSettingsDTO) {
    return (await this.grpcService.getUserSetting(
      getUserSettings.id,
    )) as Settings;
  }

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, 'getAllUsers')
  async getAllUsers(request: Empty): Promise<Users> {
    return { users: await this.grpcService.getAllUsers() };
  }
}
