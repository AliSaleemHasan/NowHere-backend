import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Settings } from '../settings/entities/settings.entity';
import { MICROSERVICES } from 'nowhere-common';
import { ClientGrpc } from '@nestjs/microservices';
import { AWS_STORAGE_SERVICE_NAME, AwsStorageClient } from 'proto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  private storageService: AwsStorageClient;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(MICROSERVICES.STORAGE.package)
    private storageClient: ClientGrpc,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  onModuleInit() {
    this.storageService = this.storageClient.getService<AwsStorageClient>(
      AWS_STORAGE_SERVICE_NAME,
    );
  }

  async createUser(createUserDto: CreateUserDTO) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async seedAdmin() {
    let email = process.env.ADMIN_EMAIL as string;
    let password = process.env.ADMIN_PASSWORD as string;

    let adminFound;

    try {
      adminFound = await this.getUserByEmail(email);
    } catch (e) {
      console.log(e.message);
    }

    if (adminFound) {
      this.logger.log('Admin user already exists, skipping seeding.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await this.createUser({
      bio: '',
      email,
      password: hashedPassword,
      role: Roles.ADMIN,
      firstName: 'admin',
      lastName: 'admin',
    });

    this.logger.log('Admin user created successfuly');
  }
  //   getUsers() just for admin (to be created when adding authorization)

  async getUserById(Id: string) {
    // each time get user is performed, aws call must be done to get the image

    const user = await this.userRepository.findOne({ where: { Id } });

    if (!user) throw new NotFoundException('User not found!');
    let userImage = await firstValueFrom(
      this.storageService.getSignedUrl({ key: user.image }),
    );

    const { password, ...rest } = user;
    return { user: rest, userImage: userImage.signed };
  }

  async getUserByEmail(email: string) {
    try {
      return await this.userRepository.findOneOrFail({
        where: { email },
      });
    } catch (e) {
      throw new NotFoundException('No user found with this email!');
    }
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }

  async setUserPhoto(imageFile: Buffer, userId: string) {
    // first try to upload it to the s3 bucket
    let imageKey = await firstValueFrom(
      await this.storageService.uploadPhoto({
        image: imageFile,
        userId,
      }),
    );

    if (!imageKey.key)
      throw new BadRequestException('Error loading Image to AWS s3');

    // now get the signedURL
    // NOTE: yes this takes too much time, however the user will not change profile image every day!
    // so it is ok if it takes some time..

    let signedURL = await firstValueFrom(
      this.storageService.getSignedUrl(imageKey),
    );

    if (!signedURL)
      throw new BadRequestException('Error Getting image signedURL..');

    const user = await this.userRepository.preload({
      Id: userId,
      image: imageKey.key,
    });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepository.save(user);

    // remove sensitive field
    const { password, ...safeUser } = updatedUser;
    return { user: safeUser, userImage: signedURL.signed };
  }

  async getUserSetting(id: string) {
    const userSettings = await this.settingsRepository.findOne({
      where: { user: { Id: id } },
      relations: { user: true },
    });

    if (userSettings) {
      let { user, ...settings } = userSettings;
      return { ...settings };
    }

    return this.createUserSettings(id);

    // create user settings
  }

  async createUserSettings(userId: string) {
    const { user, userImage } = await this.getUserById(userId);

    const settings = this.settingsRepository.create({
      user,
    });

    return await this.settingsRepository.save(settings);
  }
}
