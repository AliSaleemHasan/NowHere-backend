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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: "Create a user (user's sign up)",
    description:
      'Sign up a new user to the application by save the infromation for later use...',
  })
  createUser(@Body('user', ValidationPipe) createUserDto: CreateUserDTO) {
    this.usersService.createUser(createUserDto);
  }

  @Get(':email')
  @ApiOperation({
    description: 'Just for internal use to authenticate users by emails',
  })
  getByEmail(@Param('email') email: string) {
    // TODO: add security on this param
    this.usersService.getUserByEmail(email);
  }
}
