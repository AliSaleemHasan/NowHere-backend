import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { SnapsPatterns, ROLES } from 'contracts';
import { CreateSnapHttpDto } from '../dto/create-snap.dto';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';

function includeExpiredFromQuery(value?: string): boolean {
  if (value === undefined || value === '') {
    return true;
  }
  return value !== '0' && value.toLowerCase() !== 'false';
}

@Controller('snaps')
export class GatewaySnapsController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Get('tags')
  @UseGuards(GatewayAuthGuard)
  async findByTags(@Query('tags') tags: string[]) {
    return this.rpc.request(SnapsPatterns.FIND_BY_TAGS, { tags });
  }

  @Get('near/:lng/:lat')
  @UseGuards(GatewayAuthGuard)
  async findNear(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string[],
  ) {
    return this.rpc.request(SnapsPatterns.FIND_NEAR, {
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
    return this.rpc.request(SnapsPatterns.FIND_SEEN, {
      userId,
      lng,
      lat,
      tags,
    });
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  async findMine(
    @ReqUser('id') userId: string,
    @Query('includeExpired') includeExpired?: string,
  ) {
    return this.rpc.request(SnapsPatterns.FIND_BY_USER, {
      userId,
      includeExpired: includeExpiredFromQuery(includeExpired),
    });
  }

  @Get()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async findAll() {
    return this.rpc.request(SnapsPatterns.FIND_ALL, {});
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard)
  async findOne(@ReqUser('id') userId: string, @Param('id') id: string) {
    return this.rpc.request(SnapsPatterns.FIND_ONE, { id, userId });
  }

  @Delete(':id')
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteOne(
    @ReqUser('id') userId: string,
    @ReqUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.rpc.request(SnapsPatterns.DELETE_ONE, { id, userId, role });
  }

  @Delete()
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteAll() {
    return this.rpc.request(SnapsPatterns.DELETE_ALL, {});
  }

  @Post()
  @UseGuards(GatewayAuthGuard)
  async create(@ReqUser('id') userId: string, @Body() body: CreateSnapHttpDto) {
    return this.rpc.request(SnapsPatterns.CREATE, {
      userId,
      description: body.description,
      location: body.location,
      snaps: body.snaps,
      tag: body.tag,
      idempotencyKey: body.idempotencyKey,
    });
  }
}
