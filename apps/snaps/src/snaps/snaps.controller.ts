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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { Snap } from './schemas/snap.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtGuard, ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { FindLocationNear } from './dto/find-location-near.dto';
import { CreateSnapDocs } from './docs/create-snap.doc';
import { FindAllSnapsDocs } from './docs/find-all-snaps.doc';
import { FindOneSnapDocs } from './docs/find-one-snap.doc';
import { DeleteAllSnapsDocs } from './docs/delete-all-snaps.doc';
import { FindNearSnapsDocs } from './docs/find-near-snaps.doc';
import { FindSnapDTO } from './dto/find-snap.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { diskStorage } from 'multer';
import { DeleteResult } from 'mongoose';
import { join } from 'path';
import { SnapUploadedDto } from './dto/snap-uploaded-dto';

import { Request } from 'express';
import { User } from 'proto';

interface RequestWithUser extends Request {
  user?: User & { id?: string };
}

@Controller('snaps')
export class SnapsController {
  private logger: Logger = new Logger(SnapsController.name);
  constructor(private readonly snapsService: SnapsService) {}

  // handle getting the uploaded data
  @MessagePattern('snap-uploaded')
  async saveUploadedSnaps(
    @Payload()
    data: SnapUploadedDto,
  ) {
    await this.snapsService.handleCreateSnap(data);
  }

  @Post()
  @CreateSnapDocs()
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FilesInterceptor('snaps', 4, {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'tmp'),
        filename: (
          req: RequestWithUser,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const fileName =
            (req.user?.id || 'unknown') + Date.now() + file.originalname;
          cb(null, fileName);
        },
      }),
    }),
  )
  create(
    @ReqUser('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    snaps: Array<Express.Multer.File>,
    @Body() createSnapDto: CreateSnapDto,
  ) {
    return this.snapsService.create(id, snaps, createSnapDto);
  }

  @Get()
  @FindAllSnapsDocs()
  @UserRoles(['ADMIN'])
  @UseGuards(JwtGuard, RoleGuard)
  findAll(): Promise<Snap[]> {
    return this.snapsService.findAll();
  }

  @Get('tags')
  findByTags(@Query() query: FindSnapDTO) {
    return this.snapsService.findByTags(query.tags);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @FindOneSnapDocs()
  findOne(@ReqUser('Id') Id: string, @Param('id') id: string) {
    return this.snapsService.findOne(id, Id);
  }

  @Delete()
  @DeleteAllSnapsDocs()
  @UserRoles(['ADMIN'])
  @UseGuards(JwtGuard, RoleGuard)
  deleteAll(): Promise<DeleteResult> {
    return this.snapsService.deleteAll();
  }

  @Get('near/:lng/:lat')
  @FindNearSnapsDocs()
  async findNear(
    @Param() location: FindLocationNear,
    @Query() query: FindSnapDTO,
  ) {
    return await this.snapsService.getSeenSnaps(
      {
        ...query,
        location: [location.lng, location.lat],
      },
      query.id,
      false,
    );
  }

  @Get('seen/:lng/:lat')
  @UseGuards(JwtGuard)
  async getSeenSnaps(
    @ReqUser('Id') _userId: string,
    @Param() location: FindLocationNear,
    @Query() query: FindSnapDTO,
  ) {
    return await this.snapsService.getSeenSnaps(
      { ...query, location: [location.lng, location.lat] },
      _userId,
      false,
    );
  }
}
