import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDTO } from './dto/signin.dto';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('user', ValidationPipe) singinDTO: SigninDTO) {
    return await this.authService.login(singinDTO.username, singinDTO.password);
  }

  @Post('signup')
  async signup(@Body('user', ValidationPipe) createUserDTO: CreateUserDTO) {
    console.log(createUserDTO);
    await this.authService.signup(createUserDTO);
  }
}
