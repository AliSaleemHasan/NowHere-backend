import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO } from './dto/signin.dto';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { Request } from 'express';
import { extractTokenFromHeader } from 'common/utils/extract-authorization-header';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body('user')
    singinDTO: SigninDTO,
  ) {
    return await this.authService.login(singinDTO.email, singinDTO.password);
  }

  @Post('signup')
  async signup(@Body('user') createUserDTO: CreateUserDTO) {
    //TODO: Handle exception errors on validation (BAD REQUEST EXCEPTION IS APPEREANG)
    //TODO, re add validation with proper messages
    const data = await this.authService.signup(createUserDTO);
    return data;
  }

  @Get('refresh')
  async refresh(@Req() request: Request) {
    console.log(request.headers);
    const token = extractTokenFromHeader(request);
    console.log(token);
    return await this.authService.refreshToken(token);
  }

  @Get('validate')
  async validateToken(@Req() request: Request) {
    const token = extractTokenFromHeader(request);
    return await this.authService.verifyJwtToken(token);
  }
}
