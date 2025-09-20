import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Body,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { Snap } from './schemas/snap.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtGuard, ReqUser } from 'nowhere-common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { FindLocationNear } from './dto/find-location-near.dto';
import { CreateSnapDocs } from './docs/create-snap.doc';
import { FindAllSnapsDocs } from './docs/find-all-snaps.doc';
import { FindOneSnapDocs } from './docs/find-one-snap.doc';
import { DeleteAllSnapsDocs } from './docs/delete-all-snaps.doc';
import { FindNearSnapsDocs } from './docs/find-near-snaps.doc';
import { FindSnapDTO } from './dto/find-snap.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';
import { diskStorage } from 'multer';
import { DeleteResult } from 'mongoose';
import { join } from 'path';

@Controller('snaps')
export class SnapsController {
  private logger: Logger = new Logger(SnapsController.name);
  constructor(private readonly snapsService: SnapsService) {}

  // handle getting the uploaded data
  //TODO: handle data types
  @MessagePattern('snap-uploaded')
  async saveUploadedSnaps(
    @Payload() data: { snapId: string; keys: string[]; error: string },
  ) {
    if (data.error) {
      this.logger.log('Error uploading files!', data.error);
      await this.snapsService.deleteSnap(data.snapId);

      throw new BadRequestException(data.error);
    }
    this.logger.log(
      ` snap with idupdated  ${data.snapId} and keys are ${JSON.stringify(data.keys)} `,
    );

    let updateStatus = await this.snapsService.updateSnapImages(
      data.snapId,
      data.keys,
    );

    this.logger.log(
      'Snap service added the uploaded keys with upload status: ',
      JSON.stringify(updateStatus),
    );
  }

  @Post()
  @CreateSnapDocs()
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FilesInterceptor('snaps', 4, {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'tmp'),
        filename: (req: any, file, cb) => {
          const fileName =
            (req.user?.Id || 'unkown') + Date.now() + file.originalname;
          cb(null, fileName);
        },
      }),
    }),
  )
  create(
    @ReqUser('Id') id: string,
    @UploadedFiles() snaps: Array<Express.Multer.File>,
    @Body() createSnapDto: CreateSnapDto,
  ) {
    return this.snapsService.create(id, snaps, createSnapDto);
  }

  @Get()
  @FindAllSnapsDocs()
  findAll(): Promise<Snap[]> {
    return this.snapsService.findAll();
  }

  @Get('tags')
  findByTags(@Query() query: FindSnapDTO) {
    return this.snapsService.findByTags(query.tags);
  }

  @Get(':id')
  @FindOneSnapDocs()
  findOne(@Param('id') id: string) {
    return this.snapsService.findOne(id);
  }

  @Delete()
  @DeleteAllSnapsDocs()
  deleteAll(): Promise<DeleteResult> {
    return this.snapsService.deleteAll();
  }

  @Get('near/:lng/:lat')
  @FindNearSnapsDocs()
  async findNear(
    @Param() location: FindLocationNear,
    @Query() query: FindSnapDTO,
  ) {
    return await this.snapsService.findNear(
      [location.lng, location.lat],
      query.tags,
      query.id,
    );
  }

  //
  //      Handle snap settings
  //

  // first get snaps settings for user
}
