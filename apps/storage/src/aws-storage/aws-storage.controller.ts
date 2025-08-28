import { Controller, Get, Inject, Logger, UseGuards } from '@nestjs/common';
import { AwsStorageService } from './aws-storage.service';
import { JwtGuard } from 'common/guards/jwt-guard';
import { RoleGuard } from 'common/guards/role-guard';
import { UserRoles } from 'common/decorators/roles.decorator';
import { GetAllFilesDoc } from './docs/get-all-files.doc';
import {
  ClientProxy,
  Ctx,
  GrpcMethod,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';
import { AWS_STORAGE_SERVICE_NAME } from 'common/proto/storage';
import { MICROSERVICES } from 'common/constants';

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

  @UserRoles(['USER'])
  @UseGuards(JwtGuard, RoleGuard)
  @GrpcMethod(AWS_STORAGE_SERVICE_NAME, 'getSignedUrlForFile')
  async getSignedURL(key: string) {
    console.log(key);
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
        error: errorMessage,
      });
      //TODO: handle errors in better way
      return { error: notSaved.length };
    }

    this.redisClient.emit('snap-uploaded', {
      snapId: data.snapId,
      keys: keys,
    });

    return { keys, notSaved };
  }
}
