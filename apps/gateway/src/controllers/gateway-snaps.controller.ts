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
import { SnapsPatterns, UsersPatterns, ROLES } from 'contracts';
import { CreateSnapHttpDto } from '../dto/create-snap.dto';
import { MarkFoundHttpDto } from '../dto/mark-found.dto';
import { ReportSnapHttpDto } from '../dto/report-snap.dto';
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

  @Post(':id/found')
  @UseGuards(GatewayAuthGuard)
  async markFound(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: MarkFoundHttpDto = {},
  ) {
    return this.rpc.request(SnapsPatterns.MARK_FOUND, {
      id,
      userId,
      note: body.note,
    });
  }

  @Post(':id/reopen')
  @UseGuards(GatewayAuthGuard)
  async reopen(@ReqUser('id') userId: string, @Param('id') id: string) {
    return this.rpc.request(SnapsPatterns.REOPEN, { id, userId });
  }

  @Post(':id/report')
  @UseGuards(GatewayAuthGuard)
  async report(
    @ReqUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: ReportSnapHttpDto,
  ) {
    return this.rpc.request(UsersPatterns.CREATE_REPORT, {
      userId,
      snapId: id,
      reason: body.reason,
      details: body.details,
    });
  }

  @Get(':id')
  @UseGuards(GatewayAuthGuard)
  async findOne(@ReqUser('id') userId: string, @Param('id') id: string) {
    return this.rpc.request(SnapsPatterns.FIND_ONE, { id, userId });
  }

  // Owner-or-admin is enforced in snaps; this route only authenticates.
  @Delete(':id')
  @UseGuards(GatewayAuthGuard)
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
