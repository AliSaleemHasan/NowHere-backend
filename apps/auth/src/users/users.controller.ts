import {
  Controller,
  Get,
  Param,
  ParseFilePipe,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { GetByEmailDocs } from './docs/get-by-email.doc';
import { GetAllUsersDocs } from './docs/get-all-users.doc';
import { GetByIdDocs } from './docs/get-by-id.doc';
import { JwtGuard, ReqUser } from 'nowhere-common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AddUsersPhotoDocs } from './docs/add-user-image.doc';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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

  @Put('image')
  @AddUsersPhotoDocs()
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('photo', {}))
  async updateUserImage(
    @ReqUser('Id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 }), // 1MB
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    return await this.usersService.setUserPhoto(photo.buffer, id);
  }

  @Get('settings')
  @UseGuards(JwtGuard)
  getUserSettings(@ReqUser('Id') id: string) {
    return this.usersService.getUserSetting(id);
  }

  @Get(':email')
  @GetByEmailDocs()
  async getByEmail(@Param('email') email: string) {
    return await this.usersService.getUserByEmail(email);
  }
}
