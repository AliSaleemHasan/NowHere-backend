import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SnapsService } from './snaps.service';
import { CreateSnapDto } from './dto/create-snap.dto';
import { Snap } from './schemas/snap.schema';
// import { UpdateSnapDto } from './dto/update-snap.dto';

@Controller('snaps')
export class SnapsController {
  constructor(private readonly snapsService: SnapsService) {}

  @Post()
  create(@Body() createSnapDto: CreateSnapDto) {
    return this.snapsService.create(createSnapDto);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.snapsService.remove(+id);
  }
}
