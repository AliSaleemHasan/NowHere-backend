import { Controller } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUTH_USERS_SERVICE_NAME,
  AuthUsersController,
  GetUserSettingsDTO,
  Settings,
  User,
  ValidateTokenDto,
  ValidateUserDto,
} from 'proto';

@Controller()
export class GrpcController implements AuthUsersController {
  constructor(private readonly grpcService: GrpcService) {}

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
}
