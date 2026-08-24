import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { GetAllFilesDoc } from './docs/get-all-files.doc';
import { GetSignURLDoc } from './docs/get-signed-url.doc';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';
import {
  MICROSERVICES,
  JwtGuard,
  RoleGuard,
  UserRoles,
  ReqUser,
} from 'nowhere-common';

@Controller('storage')
export class StorageController {
  private logger: Logger = new Logger(StorageController.name);

  constructor(
    private readonly storageService: StorageService,
    @Inject(MICROSERVICES.STORAGE.redis?.package || 'STORAGE_REDIS')
    private readonly redisClient: ClientProxy,
  ) {}

  @Get('/')
  @UseGuards(JwtGuard, RoleGuard)
  @UserRoles(['ADMIN'])
  @GetAllFilesDoc()
  async getAllFiles() {
    return await this.storageService.listFiles();
  }

  @Get('signed')
  @GetSignURLDoc()
  async getSignedURL(@Query('key') key: string) {
    return await this.storageService.getSignedUrlForFile(key);
  }

  @Post('presigned-upload')
  @UseGuards(JwtGuard)
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

    return await this.storageService.getPresignedUploadUrl(
      key,
      body.contentType || 'image/jpeg',
    );
  }

  @MessagePattern('upload-snap')
  async handleSnapUpload(
    @Payload()
    data: { files: Array<Express.Multer.File>; userId: string; snapId: string },
    @Ctx() context: RedisContext,
  ) {
    this.logger.log(
      `Storage service received a message from channel : ${context.getChannel()} `,
    );

    const { keys, notSaved } = await this.storageService.saveLocalFiles(
      data.files,
      data.userId,
    );

    if (notSaved.length > 0) {
      const errorMessage = `Some files are not saved correctly : \n ${JSON.stringify(notSaved)}`;
      this.logger.error(errorMessage);

      this.redisClient.emit('snap-uploaded', {
        snapId: data.snapId,
        filesNames: data.files.map((file) => file.filename),
        error: errorMessage,
      });
      return { error: notSaved.length };
    }

    this.redisClient.emit('snap-uploaded', {
      snapId: data.snapId,
      filesNames: data.files.map((file) => file.filename),
      keys: keys,
    });

    return { keys, notSaved };
  }
}
