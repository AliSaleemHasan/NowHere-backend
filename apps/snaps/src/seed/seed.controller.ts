import { Controller, Get, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  seedGet() {
    return this.seedService.seed();
  }

  @Post()
  seedPost() {
    return this.seedService.seed();
  }
}
