import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { Snap } from './schemas/snap.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
// import { UpdateSnapDto } from './dto/update-snap.dto';
import { Express } from 'express';

@Controller('snaps')
export class SnapsController {
  constructor(private readonly snapsService: SnapsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
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
  create(@UploadedFile('file') file: Express.Multer.File) {
    console.log(file);
    return {
      message: 'Upload successful',
      filename: file.filename,
      path: file.path,
    };
  }

  @Get()
  async findAll(): Promise<Snap[]> {
    return this.snapsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.snapsService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSnapDto: UpdateSnapDto) {
  //   return this.snapsService.update(+id, updateSnapDto);
  // }
}
