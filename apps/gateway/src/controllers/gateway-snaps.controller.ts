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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { ReqUser, RoleGuard, UserRoles } from 'nowhere-common';
import { SnapsPatterns, UsersPatterns, ROLES, toStringList } from 'contracts';
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

@ApiTags('snaps')
@ApiBearerAuth()
@Controller('snaps')
export class GatewaySnapsController {
  constructor(private readonly rpc: GatewayRpcClient) {}

  @Get('tags')
  @ApiOperation({ summary: 'Find snaps by tags' })
  @UseGuards(GatewayAuthGuard)
  async findByTags(@Query('tags') tags?: string | string[]) {
    return this.rpc.request(SnapsPatterns.FIND_BY_TAGS, {
      tags: toStringList(tags),
    });
  }

  @Get('near/:lng/:lat')
  @ApiOperation({ summary: 'Snaps near a point (uses caller settings)' })
  @UseGuards(GatewayAuthGuard)
  async findNear(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string | string[],
  ) {
    return this.rpc.request(SnapsPatterns.FIND_NEAR, {
      userId,
      lng,
      lat,
      tags: toStringList(tags),
    });
  }

  @Get('seen/:lng/:lat')
  @ApiOperation({ summary: 'Previously seen snaps near a point' })
  @UseGuards(GatewayAuthGuard)
  async getSeenSnaps(
    @ReqUser('id') userId: string,
    @Param('lng') lng: string,
    @Param('lat') lat: string,
    @Query('tags') tags?: string | string[],
  ) {
    return this.rpc.request(SnapsPatterns.FIND_SEEN, {
      userId,
      lng,
      lat,
      tags: toStringList(tags),
    });
  }

  @Get('me')
  @ApiOperation({
    summary: 'Current user snaps',
    description:
      'Defaults to including expired snaps so the author can delete leftovers. Pass includeExpired=0 to hide them.',
  })
  @ApiQuery({
    name: 'includeExpired',
    required: false,
    description: 'Default true. Pass 0 or false for active-only.',
  })
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
  @ApiOperation({ summary: 'List all snaps (admin)' })
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async findAll() {
    return this.rpc.request(SnapsPatterns.FIND_ALL, {});
  }

  @Post(':id/found')
  @ApiOperation({ summary: 'Mark a LOST/FINDINGS snap as FOUND' })
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
  @ApiOperation({ summary: 'Reopen a FOUND snap (author only)' })
  @UseGuards(GatewayAuthGuard)
  async reopen(@ReqUser('id') userId: string, @Param('id') id: string) {
    return this.rpc.request(SnapsPatterns.REOPEN, { id, userId });
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a snap' })
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
  @ApiOperation({ summary: 'Get one snap (marks seen)' })
  @UseGuards(GatewayAuthGuard)
  async findOne(@ReqUser('id') userId: string, @Param('id') id: string) {
    return this.rpc.request(SnapsPatterns.FIND_ONE, { id, userId });
  }

  // Owner-or-admin is enforced in snaps; this route only authenticates.
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a snap (owner or admin); removes storage keys',
  })
  @UseGuards(GatewayAuthGuard)
  async deleteOne(
    @ReqUser('id') userId: string,
    @ReqUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.rpc.request(SnapsPatterns.DELETE_ONE, { id, userId, role });
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all snaps (admin)' })
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async deleteAll() {
    return this.rpc.request(SnapsPatterns.DELETE_ALL, {});
  }

  @Post()
  @ApiOperation({
    summary: 'Create a snap',
    description:
      'Pass a UUID idempotencyKey to replay an in-flight create instead of inserting twice.',
  })
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
