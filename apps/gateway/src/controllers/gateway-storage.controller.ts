import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GatewayAuthGuard } from '../guards/auth.guard';
import {
  ReqUser,
  RoleGuard,
  UserRoles,
  assertAllowedContentType,
  assertOwnedObjectKey,
  buildOwnedObjectKey,
  MAX_UPLOAD_BATCH,
} from 'nowhere-common';
import { StoragePatterns, ROLES, isAdminRole } from 'contracts';
import { PresignedUploadDto } from '../dto/presigned-upload.dto';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class GatewayStorageController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Get('/')
  @ApiOperation({ summary: 'List object keys (admin)' })
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllFiles() {
    return this.rpc.request(StoragePatterns.LIST_FILES, {});
  }

  @Get('signed')
  @ApiOperation({ summary: 'Signed download URL for an owned object key' })
  @ApiQuery({ name: 'key', required: true })
  @UseGuards(GatewayAuthGuard)
  async getSignedURL(
    @ReqUser() user: { id: string; role?: string },
    @Query('key') key: string,
  ) {
    if (!key) {
      throw new BadRequestException('key is required');
    }
    assertOwnedObjectKey(key, user.id, isAdminRole(user.role));
    return this.rpc.request(StoragePatterns.GET_SIGNED_URL, { key });
  }

  @Post('presigned-upload')
  @ApiOperation({
    summary: 'Presigned upload URL(s)',
    description:
      'Client PUTs bytes to object storage, then creates a snap with the returned keys.',
  })
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
          return this.rpc.request(StoragePatterns.GET_PRESIGNED_UPLOAD, {
            key,
            contentType,
          });
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

    return this.rpc.request(StoragePatterns.GET_PRESIGNED_UPLOAD, {
      key,
      contentType,
    });
  }
}
