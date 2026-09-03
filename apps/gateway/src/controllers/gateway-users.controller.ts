import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersPatterns, ROLES, UserDto } from 'contracts';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';

@Controller('users')
export class GatewayUsersController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Get('id/:id')
  @UseGuards(GatewayAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.rpc.request<{ user: UserDto; userImage: string }, { id: string }>(
      UsersPatterns.GET_USER_BY_ID,
      { id },
    );
  }

  @Get()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllUsers() {
    return this.rpc.request(UsersPatterns.GET_ALL_USERS_INFO, {});
  }

  @Put('image')
  @UseGuards(GatewayAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateUserImage(
    @ReqUser('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    return this.rpc.request(UsersPatterns.SET_USER_PHOTO, {
      image: photo.buffer,
      userId: id,
    });
  }

  @Get('settings')
  @UseGuards(GatewayAuthGuard)
  async getUserSettings(@ReqUser('id') id: string) {
    return this.rpc.request(UsersPatterns.GET_SETTINGS, { id });
  }

  @Get(':email')
  @UseGuards(GatewayAuthGuard)
  async getByEmail(@Param('email') email: string) {
    return this.rpc.request(UsersPatterns.GET_USER_BY_EMAIL, { email });
  }
}
