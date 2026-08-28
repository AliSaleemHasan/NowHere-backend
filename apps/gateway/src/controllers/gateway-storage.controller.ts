import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { StoragePatterns, ROLES } from 'contracts';
import { firstValueFrom } from 'rxjs';

@Controller('storage')
export class GatewayStorageController {
  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  @Get('/')
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllFiles() {
    return await firstValueFrom(
      this.natsClient.send(StoragePatterns.LIST_FILES, {}),
    );
  }

  @Get('signed')
  @UseGuards(GatewayAuthGuard)
  async getSignedURL(@Query('key') key: string) {
    return await firstValueFrom(
      this.natsClient.send(StoragePatterns.GET_SIGNED_URL, { key }),
    );
  }

  @Post('presigned-upload')
  @UseGuards(GatewayAuthGuard)
  async getPresignedUploadURL(
    @ReqUser('id') userId: string,
    @Body() body: { filename?: string; contentType?: string; prefix?: string },
  ) {
    const today = new Date().toISOString().split('T')[0];
    const uniqueSuffix =
      Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const ext = body.filename ? body.filename.split('.').pop() : 'jpg';
    const folder = body.prefix || 'snaps';
    const key = `${folder}/${today}/${userId || 'user'}/${uniqueSuffix}.${ext}`;

    return await firstValueFrom(
      this.natsClient.send(StoragePatterns.GET_PRESIGNED_UPLOAD, {
        key,
        contentType: body.contentType || 'image/jpeg',
      }),
    );
  }
}
