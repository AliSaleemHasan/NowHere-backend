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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'common/guards/jwt-guard';
import { User } from './entities/user.entity';
import { GetByEmailDocs } from './docs/get-by-email.doc';
import { GetAllUsersDocs } from './docs/get-all-users.doc';
import { GetByIdDocs } from './docs/get-by-id.doc';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':email')
  @GetByEmailDocs()
  async getByEmail(@Param('email') email: string) {
    return await this.usersService.getUserByEmail(email);
  }

  @Get('id/:id')
  @GetByIdDocs()
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  //TODO: add jwt guard on this controller
  @Get()
  @GetAllUsersDocs()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }
}
