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
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { Snap } from './schemas/snap.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from 'common/guards/jwt-guard';
import { CreateSnapDto } from './dto/create-snap.dto';
import { ReqUser } from 'common/decorators/user.decorator';
import { FindLocationNear } from './dto/find-location-near.dto';
import { CreateSnapDocs } from './docs/create-snap.doc';
import { FindAllSnapsDocs } from './docs/find-all-snaps.doc';
import { FindOneSnapDocs } from './docs/find-one-snap.doc';
import { DeleteAllSnapsDocs } from './docs/delete-all-snaps.doc';
import { FindNearSnapsDocs } from './docs/find-near-snaps.doc';
import { FindSnapDTO } from './dto/find-snap.dto';

@Controller('snaps')
export class SnapsController {
  constructor(private readonly snapsService: SnapsService) {}

  @Post()
  @CreateSnapDocs()
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @UseGuards(JwtGuard)
  @UseInterceptors(FilesInterceptor('snaps', 4, {}))
  create(
    @ReqUser('_id') id: string,
    @UploadedFiles() snaps: Array<Express.Multer.File>,
    @Body() createSnapDto: CreateSnapDto,
  ) {
    return this.snapsService.create(id, snaps, createSnapDto);
  }

  @Get()
  @FindAllSnapsDocs()
  async findAll(): Promise<Snap[]> {
    return this.snapsService.findAll();
  }

  @Get('tags')
  findByTags(@Query() query: FindSnapDTO) {
    return this.snapsService.findByTags(query.tags);
  }

  @Get(':id')
  @FindOneSnapDocs()
  findOne(@Param('id') id: string) {
    console.log(id);
    return this.snapsService.findOne(id);
  }

  @Delete()
  @DeleteAllSnapsDocs()
  deleteAll() {
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
