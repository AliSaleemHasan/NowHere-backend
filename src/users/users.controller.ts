import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  createUser(@Body('user', ValidationPipe) createUserDto: CreateUserDTO) {
    this.usersService.createUser(createUserDto);
  }

  @Get(':email')
  getByEmail(@Param('email') email: string) {
    // TODO: add security on this param
    this.usersService.getUserByEmail(email);
  }
}
