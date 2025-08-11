import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'common/guards/jwt-guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':email')
  @ApiOperation({
    description: 'Just for internal use to authenticate users by emails',
  })
  async getByEmail(@Param('email') email: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) return 'User not Found';
    let { password, ...rest } = user;
    return rest;
  }

  @Get()
  // @UseGuards(JwtGuard)
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }
}
