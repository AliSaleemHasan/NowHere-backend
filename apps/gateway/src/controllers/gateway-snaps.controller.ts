import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SnapsPatterns, ROLES } from 'contracts';
import { firstValueFrom } from 'rxjs';

@Controller('snaps')
export class GatewaySnapsController {
  constructor(
    @Inject('NATS_CLIENT') private readonly natsClient: ClientProxy,
  ) {}

  @Get()
  @UseGuards(GatewayAuthGuard)
  async findAll() {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.FIND_ALL, {}),
    );
  }

  @Get('tags')
  @UseGuards(GatewayAuthGuard)
  async findByTags(@Query('tags') tags: string[]) {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.FIND_BY_TAGS, { tags }),
    );
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard)
  async findOne(@ReqUser('id') userId: string, @Param('id') id: string) {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.FIND_ONE, { id, userId }),
    );
  }

  @Delete(':id')
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteOne(@Param('id') id: string) {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.DELETE_ONE, { id }),
    );
  }

  @Delete()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteAll() {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.DELETE_ALL, {}),
    );
  }

  @Get('near/:lng/:lat')
  @UseGuards(GatewayAuthGuard)
  async findNear(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string[],
  ) {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.FIND_NEAR, {
        userId,
        lng,
        lat,
        tags,
      }),
    );
  }

  @Get('seen/:lng/:lat')
  @UseGuards(GatewayAuthGuard)
  async getSeenSnaps(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string[],
  ) {
    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.FIND_SEEN, {
        userId,
        lng,
        lat,
        tags,
      }),
    );
  }

  @Post()
  @UseGuards(GatewayAuthGuard)
  @UseInterceptors(FilesInterceptor('snaps', 4))
  async create(
    @ReqUser('id') userId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    snapsFiles: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    let preuploadedKeys: string[] = [];
    if (Array.isArray(body.snaps)) {
      preuploadedKeys = body.snaps;
    } else if (typeof body.snaps === 'string' && body.snaps.startsWith('[')) {
      try {
        preuploadedKeys = JSON.parse(body.snaps);
      } catch {
        preuploadedKeys = [body.snaps];
      }
    }

    const files = (snapsFiles || []).map((f) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      buffer: f.buffer,
      size: f.size,
      filename: f.filename || `${userId}_${Date.now()}_${f.originalname}`,
    }));

    return await firstValueFrom(
      this.natsClient.send(SnapsPatterns.CREATE, {
        userId,
        ...body,
        snaps: preuploadedKeys.length > 0 ? preuploadedKeys : undefined,
        files: files.length > 0 ? files : undefined,
      }),
    );
  }
}
