import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import {
  ReqUser,
  RoleGuard,
  UserRoles,
  natsRequest,
  assertAllowedContentType,
  assertOwnedObjectKey,
  buildOwnedObjectKey,
  MAX_UPLOAD_BATCH,
} from 'nowhere-common';
import { StoragePatterns, ROLES } from 'contracts';
import { PresignedUploadDto } from '../dto/presigned-upload.dto';

@Controller('storage')
export class GatewayStorageController {
  constructor(@Inject('NATS_CLIENT') private readonly natsClient: ClientProxy) {}

  @Get('/')
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllFiles() {
    return await natsRequest(this.natsClient, StoragePatterns.LIST_FILES, {});
  }

  @Get('signed')
  @UseGuards(GatewayAuthGuard)
  async getSignedURL(
    @ReqUser() user: { id: string; role?: string },
    @Query('key') key: string,
  ) {
    if (!key) {
      throw new BadRequestException('key is required');
    }
    const isAdmin = user.role === ROLES.ADMIN || user.role === 'ADMIN';
    assertOwnedObjectKey(key, user.id, isAdmin);
    return await natsRequest(this.natsClient, StoragePatterns.GET_SIGNED_URL, {
      key,
    });
  }

  @Post('presigned-upload')
  @UseGuards(GatewayAuthGuard)
  async getPresignedUploadURL(
    @ReqUser('id') userId: string,
    @Body() body: PresignedUploadDto,
  ) {
    if (Array.isArray(body.files) && body.files.length > 0) {
      if (body.files.length > MAX_UPLOAD_BATCH) {
        throw new BadRequestException(
          `At most ${MAX_UPLOAD_BATCH} files per request`,
        );
      }
      const results = await Promise.all(
        body.files.map(async (file) => {
          const contentType = assertAllowedContentType(file.contentType);
          const key = buildOwnedObjectKey({
            prefix: body.prefix,
            userId,
            filename: file.filename,
          });
          return await natsRequest(
            this.natsClient,
            StoragePatterns.GET_PRESIGNED_UPLOAD,
            { key, contentType },
          );
        }),
      );
      return { uploads: results };
    }

    const contentType = assertAllowedContentType(body.contentType);
    const key = buildOwnedObjectKey({
      prefix: body.prefix,
      userId,
      filename: body.filename,
    });

    return await natsRequest(
      this.natsClient,
      StoragePatterns.GET_PRESIGNED_UPLOAD,
      { key, contentType },
    );
  }
}
