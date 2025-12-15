import { Controller } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUTH_USERS_SERVICE_NAME,
  UsersController,
  CreateUserDTO as ProtoCreateUserDto,
  GetUserSettingsDTO,
  Settings,
  UserObject as User,
  ValidateTokenDto,
  ValidateUserDto,
  Users,
  type Empty,
  NotSeenDto,
  SeenObjects,
  SeenObject,
  Success,
  CreateUser,
  EmptyUserInfo,
  UsersObject,
  UserSetting,
  UserSettingFetchDTO,
  UserNotSeenObject,
  UserSeenObjects,
  UserSeenObject,
  UserSuccess,
} from 'proto';
import { mapUserToProto } from './mappers/user-mappers';
import { Observable } from 'rxjs';

@Controller()
export class GrpcController implements UsersController {
  constructor(private readonly grpcService: GrpcService) { }


  async createUserInfo(request: CreateUser): Promise<User> {
    return mapUserToProto(await this.grpcService.createUser(request));

  }
  async getAllUsersInfo(request: EmptyUserInfo): Promise<UsersObject> {
    return { users: await this.grpcService.getAllUsers() };
  }

  async getSettings(request: UserSettingFetchDTO): Promise<UserSetting> {
    return await this.grpcService.getUserSetting(request.id) as UserSetting;
  }
  // @GrpcMethod(AUTH_USERS_SERVICE_NAME)
  // async validateUser(validateUserDto: ValidateUserDto): Promise<User> {
  //   return await this.grpcService.validateUser(validateUserDto);
  // }

  // @GrpcMethod(AUTH_USERS_SERVICE_NAME)
  // async validateToken(request: ValidateTokenDto): Promise<User> {
  //   return await this.grpcService.validateToken(request.token);
  // }


  async notSeenSnaps(request: UserNotSeenObject): Promise<UserSeenObjects> {
    return await this.grpcService.notSeen(request);
  }

  async setSeenSnap(request: UserSeenObject): Promise<UserSuccess> {
    return await this.grpcService.setSeen(request);
  }
}
