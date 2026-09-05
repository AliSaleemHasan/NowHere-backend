import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GatewayAuthGuard } from '../guards/auth.guard';
import {
  ReqUser,
  RoleGuard,
  UserRoles,
  throwHttpProblem,
} from 'nowhere-common';
import { AuthPatterns, UsersPatterns, ROLES, UserDto } from 'contracts';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';
import { AccountDeleteOrchestrator } from '../account-delete.orchestrator';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  SetUserPhotoDto,
  UpdateProfileDto,
  UpdateSettingsDto,
} from '../dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class GatewayUsersController {
  constructor(
    private readonly rpc: GatewayRpcClient,
    private readonly accountDelete: AccountDeleteOrchestrator,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get current user settings (creates defaults)' })
  @UseGuards(GatewayAuthGuard)
  async getUserSettings(@ReqUser('id') id: string) {
    return this.rpc.request(UsersPatterns.GET_SETTINGS, { id });
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update settings (preset distances and TTL)' })
  @UseGuards(GatewayAuthGuard)
  async updateUserSettings(
    @ReqUser('id') id: string,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.rpc.request(UsersPatterns.UPDATE_SETTINGS, {
      userId: id,
      ...body,
    });
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update first name, last name, or bio' })
  @UseGuards(GatewayAuthGuard)
  async updateMe(@ReqUser('id') id: string, @Body() body: UpdateProfileDto) {
    return this.rpc.request(UsersPatterns.UPDATE_PROFILE, {
      userId: id,
      ...body,
    });
  }

  @Get('me/export')
  @ApiOperation({
    summary: 'DSGVO JSON export',
    description: 'Object storage keys, not signed URLs.',
  })
  @UseGuards(GatewayAuthGuard)
  async exportMe(@ReqUser('id') userId: string) {
    return this.rpc.request(UsersPatterns.EXPORT_USER, { userId });
  }

  @Delete('me')
  @ApiOperation({
    summary: 'Delete account',
    description:
      'Re-auth with password, then deactivate, delete snaps + storage keys, purge profile, delete credentials.',
  })
  @UseGuards(GatewayAuthGuard)
  async deleteMe(
    @ReqUser('id') userId: string,
    @Body() body: DeleteAccountDto,
  ) {
    return this.accountDelete.deleteAccount(userId, body.password);
  }

  @Post('me/password')
  @ApiOperation({ summary: 'Change password' })
  @UseGuards(GatewayAuthGuard)
  async changePassword(
    @ReqUser('id') id: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.rpc.request(AuthPatterns.CHANGE_PASSWORD, {
      userId: id,
      ...body,
    });
  }

  @Get('me/bookmarks')
  @ApiOperation({ summary: 'List bookmarks' })
  @UseGuards(GatewayAuthGuard)
  async listBookmarks(@ReqUser('id') userId: string) {
    return this.rpc.request(UsersPatterns.LIST_BOOKMARKS, { userId });
  }

  @Put('me/bookmarks/:snapId')
  @ApiOperation({ summary: 'Save a snap' })
  @UseGuards(GatewayAuthGuard)
  async addBookmark(
    @ReqUser('id') userId: string,
    @Param('snapId') snapId: string,
  ) {
    return this.rpc.request(UsersPatterns.ADD_BOOKMARK, { userId, snapId });
  }

  @Delete('me/bookmarks/:snapId')
  @ApiOperation({ summary: 'Remove a bookmark' })
  @UseGuards(GatewayAuthGuard)
  async removeBookmark(
    @ReqUser('id') userId: string,
    @Param('snapId') snapId: string,
  ) {
    return this.rpc.request(UsersPatterns.REMOVE_BOOKMARK, { userId, snapId });
  }

  @Put('image')
  @ApiOperation({
    summary: 'Attach a previously uploaded profile photo',
    description:
      'Client PUTs bytes via POST /storage/presigned-upload with prefix profile, then sends the returned key here.',
  })
  @UseGuards(GatewayAuthGuard)
  async updateUserImage(
    @ReqUser('id') id: string,
    @Body() body: SetUserPhotoDto,
  ) {
    return this.rpc.request(UsersPatterns.SET_USER_PHOTO, {
      key: body.key,
      userId: id,
    });
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get user by id' })
  @UseGuards(GatewayAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.rpc.request<
      { user: UserDto; userImage: string },
      { id: string }
    >(UsersPatterns.GET_USER_BY_ID, { id });
  }

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  @UserRoles([ROLES.ADMIN])
  @UseGuards(GatewayAuthGuard, RoleGuard)
  async getAllUsers() {
    return this.rpc.request(UsersPatterns.GET_ALL_USERS_INFO, {});
  }

  @Get(':email')
  @ApiOperation({ summary: 'Get user by email' })
  @UseGuards(GatewayAuthGuard)
  async getByEmail(
    @ReqUser() actor: { email?: string; role?: string },
    @Param('email') email: string,
  ) {
    const isSelf = (actor.email || '').toLowerCase() === email.toLowerCase();
    if (!isSelf && actor.role !== ROLES.ADMIN) {
      throwHttpProblem(HttpStatus.FORBIDDEN, 'Forbidden');
    }
    return this.rpc.request(UsersPatterns.GET_USER_BY_EMAIL, { email });
  }
}
