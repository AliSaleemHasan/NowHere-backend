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
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles, natsRequest } from 'nowhere-common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersPatterns, StoragePatterns, ROLES } from 'contracts';

@Controller('users')
export class GatewayUsersController {
  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  @Get('id/:id')
  @UseGuards(GatewayAuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await natsRequest(this.natsClient, UsersPatterns.GET_USER_BY_ID, {
      id,
    });

    let userImage = '';
    if (user?.image) {
      try {
        const res = await natsRequest<{ signed: string }>(
          this.natsClient,
          StoragePatterns.GET_SIGNED_URL,
          { key: user.image },
        );
        userImage = res?.signed || '';
      } catch {
        // Gracefully degrade if storage is unavailable
      }
    }
    return { user, userImage };
  }

  @Get()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllUsers() {
    return await natsRequest(
      this.natsClient,
      UsersPatterns.GET_ALL_USERS_INFO,
      {},
    );
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
    return await natsRequest(this.natsClient, UsersPatterns.SET_USER_PHOTO, {
      image: photo.buffer,
      userId: id,
    });
  }

  @Get('settings')
  @UseGuards(GatewayAuthGuard)
  async getUserSettings(@ReqUser('id') id: string) {
    return await natsRequest(this.natsClient, UsersPatterns.GET_SETTINGS, {
      id,
    });
  }

  @Get(':email')
  @UseGuards(GatewayAuthGuard)
  async getByEmail(@Param('email') email: string) {
    return await natsRequest(this.natsClient, UsersPatterns.GET_USER_BY_EMAIL, {
      email,
    });
  }
}
