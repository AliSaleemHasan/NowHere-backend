import { Controller } from '@nestjs/common';
import { GrpcService } from './grpc.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUTH_SERVICE_NAME,
  AuthServiceController,
  User,
  ValidateTokenDto,
  ValidateUserDto,
} from 'common/proto/auth/auth';

@Controller()
export class GrpcController implements AuthServiceController {
  constructor(private readonly grpcService: GrpcService) {}

  @GrpcMethod(AUTH_SERVICE_NAME)
  async validateUser(validateUserDto: ValidateUserDto): Promise<User> {
    return await this.grpcService.validateUser(validateUserDto);
  }

  @GrpcMethod(AUTH_SERVICE_NAME)
  async validateToken(request: ValidateTokenDto): Promise<User> {
    return await this.grpcService.validateToken(request.token);
  }
}
