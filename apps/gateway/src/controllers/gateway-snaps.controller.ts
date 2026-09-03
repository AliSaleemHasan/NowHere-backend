import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles, natsRequest } from 'nowhere-common';
import { SnapsPatterns, ROLES } from 'contracts';
import { CreateSnapHttpDto } from '../dto/create-snap.dto';

@Controller('snaps')
export class GatewaySnapsController {
  constructor(
    @Inject('NATS_CLIENT') private readonly natsClient: ClientProxy,
  ) {}

  @Get('tags')
  @UseGuards(GatewayAuthGuard)
  async findByTags(@Query('tags') tags: string[]) {
    return await natsRequest(this.natsClient, SnapsPatterns.FIND_BY_TAGS, {
      tags,
    });
  }

  @Get('near/:lng/:lat')
  @UseGuards(GatewayAuthGuard)
  async findNear(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string[],
  ) {
    return await natsRequest(this.natsClient, SnapsPatterns.FIND_NEAR, {
      userId,
      lng,
      lat,
      tags,
    });
  }

  @Get('seen/:lng/:lat')
  @UseGuards(GatewayAuthGuard)
  async getSeenSnaps(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string[],
  ) {
    return await natsRequest(this.natsClient, SnapsPatterns.FIND_SEEN, {
      userId,
      lng,
      lat,
      tags,
    });
  }

  @Get()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async findAll() {
    return await natsRequest(this.natsClient, SnapsPatterns.FIND_ALL, {});
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard)
  async findOne(@ReqUser('id') userId: string, @Param('id') id: string) {
    return await natsRequest(this.natsClient, SnapsPatterns.FIND_ONE, {
      id,
      userId,
    });
  }

  @Delete(':id')
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteOne(@Param('id') id: string) {
    return await natsRequest(this.natsClient, SnapsPatterns.DELETE_ONE, { id });
  }

  @Delete()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteAll() {
    return await natsRequest(this.natsClient, SnapsPatterns.DELETE_ALL, {});
  }

  @Post()
  @UseGuards(GatewayAuthGuard)
  async create(
    @ReqUser('id') userId: string,
    @Body() body: CreateSnapHttpDto,
  ) {
    return await natsRequest(this.natsClient, SnapsPatterns.CREATE, {
      userId,
      description: body.description,
      location: body.location,
      snaps: body.snaps,
      tag: body.tag,
    });
  }
}
