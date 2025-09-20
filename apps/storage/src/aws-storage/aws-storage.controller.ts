import {
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AwsStorageService } from './aws-storage.service';
import { GetAllFilesDoc } from './docs/get-all-files.doc';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';
import { MICROSERVICES, JwtGuard, RoleGuard, UserRoles } from 'nowhere-common';
@Controller('storage')
export class AwsStorageController {
  private logger: Logger = new Logger(AwsStorageController.name);
  constructor(
    private storageService: AwsStorageService,
    @Inject(MICROSERVICES.STORAGE.package) private redisClient: ClientProxy,
  ) {}

  @Get('/')
  @UseGuards(JwtGuard, RoleGuard)
  @UserRoles(['ADMIN'])
  @GetAllFilesDoc()
  async getAllFiles() {
    return await this.storageService.listFiles();
  }

  @Get('signed')
  async getSignedURL(@Query('key') key: string) {
    return await this.storageService.getSignedUrlForFile(key);
  }

  //TODO: handle (payload) types

  @MessagePattern('upload-snap')
  async handleSnapUpload(
    @Payload()
    data: { files: Array<Express.Multer.File>; userId: string; snapId: string },
    @Ctx() context: RedisContext,
  ) {
    this.logger.log(
      `Storage service recieved a message from chanel : ${context.getChannel()} `,
    );

    let { keys, notSaved } = await this.storageService.saveLocalFiles(
      data.files,
      data.userId,
    );

    if (notSaved.length > 0) {
      let errorMessage = `Some files are not saved correctly : \n ******************************* ${JSON.stringify(notSaved)}  \n *************`;

      this.logger.error(errorMessage);

      this.redisClient.emit('snap-uploaded', {
        snapId: data.snapId,
        filesNames: data.files.map((file) => file.filename),
        error: errorMessage,
      });
      //TODO: handle errors in better way
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
