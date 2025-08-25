import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtGuard } from 'common/guards/jwt-guard';
import { RoleGuard } from 'common/guards/role-guard';
import { UserRoles } from 'common/decorators/roles.decorator';
import { GetAllFilesDoc } from './docs/get-all-files.doc';
import { GetSignURLDoc } from './docs/get-signed-url.doc';

@UseGuards(JwtGuard, RoleGuard)
@UserRoles(['admin'])
@Controller('storage')
export class StorageController {
  constructor(private storageSeriver: StorageService) {}

  @Get('/')
  @GetAllFilesDoc()
  async getAllFiles() {
    return await this.storageSeriver.listFiles();
  }

  @Get('/signed')
  @GetSignURLDoc()
  async getSignedURL(@Query('key') key: string) {
    console.log(key);
    return await this.storageSeriver.getSignedUrlForFile(key);
  }
}
