import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  UploadedFiles,
  Body,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { Snap } from './schemas/snap.schema';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
// import { UpdateSnapDto } from './dto/update-snap.dto';
import { Express } from 'express';
import { JwtGuard } from 'common/guards/jwt-guard';
import { CreateSnapDto } from './dto/create-snap.dto';
import { ReqUser } from 'common/decorators/user.decorator';

@Controller('snaps')
export class SnapsController {
  constructor(private readonly snapsService: SnapsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FilesInterceptor('snaps', 4, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // you can generate a unique name here, e.g. timestamp + original ext
          const name = file.originalname;
          callback(null, name);
        },
      }),
    }),
  )
  create(
    @ReqUser('_id') id: string,
    @UploadedFiles() snaps: Array<Express.Multer.File>,
    @Body() createSnapDto: CreateSnapDto,
  ) {
    return this.snapsService.create(id, snaps, createSnapDto);
  }

  @Get()
  async findAll(): Promise<Snap[]> {
    return this.snapsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.snapsService.findOne(id);
  }

  @Delete()
  deleteAll() {
    return this.snapsService.deleteAll();
  }
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSnapDto: UpdateSnapDto) {
  //   return this.snapsService.update(+id, updateSnapDto);
  // }
}
