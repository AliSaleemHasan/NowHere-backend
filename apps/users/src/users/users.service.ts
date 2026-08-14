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
import { In, Not, Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { Settings } from '../settings/entities/settings.entity';
import { STORAGE_GRPC, CREDENTIALS_GRPC, tryCatch } from 'nowhere-common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  AuthUserRole,
  AWS_STORAGE_SERVICE_NAME,
  AwsStorageClient,
  CREDENTIALS_SERVICE_NAME,
  CredentialsClient,
  UserNotSeenObject,
  UserSeenObject,
} from 'proto';
import { firstValueFrom } from 'rxjs';
import { SnapSeen } from './entities/snaps-seen.entity';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  private storageService: AwsStorageClient;
  private credentialsService: CredentialsClient;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(SnapSeen) private snapSeenRepo: Repository<SnapSeen>,

    @Inject(STORAGE_GRPC)
    private storageClient: ClientGrpc,
    @Inject(CREDENTIALS_GRPC)
    private credentialsClient: ClientGrpc,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.storageService = this.storageClient.getService<AwsStorageClient>(
      AWS_STORAGE_SERVICE_NAME,
    );

    this.credentialsService =
      this.credentialsClient.getService<CredentialsClient>(
        CREDENTIALS_SERVICE_NAME,
      );

    this.seedAdmin();
  }

  async createUser(createUserDto: CreateUserDTO) {
    const user = this.userRepository.create({
      ...createUserDto,
      id: createUserDto.id, // Ensure Explicit ID assignment
    });
    return this.userRepository.save(user);
  }

  async seedAdmin() {
    // Check if admin user profile (User Entity) already exists
    let email = this.configService.get<string>('ADMIN_EMAIL') as string;
    let password = this.configService.get<string>('ADMIN_PASSWORD') as string;

    // first check if admin credentials exist
    let { error, data: adminCredentials } = await tryCatch(
      firstValueFrom(
        this.credentialsService.validateAuthUser({ email, password }),
      ),
    );

    // if (error) { this.logger.error(error.message); return; }

    if (adminCredentials) {
      this.logger.log('Admin user already exists, skipping seeding.');
      return;
    }

    let { error: SignupError, data: adminUser } = await tryCatch(
      firstValueFrom(
        this.credentialsService.signup({
          email,
          password,
          role: AuthUserRole.ADMIN,
        }),
      ),
    );

    if (SignupError || !adminUser) {
      this.logger.error(SignupError?.message || 'Admin User Signup Failed');
      return;
    }

    await this.createUser({
      id: adminUser.user?.id,
      bio: '',
      email,
      firstName: 'admin',
      lastName: 'admin',
    });

    this.logger.log(
      `Admin user seeded successfully with ID: ${adminUser.user?.id}`,
    );
  }
  //   getUsers() just for admin (to be created when adding authorization)

  // implement getUserByEmail
  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async getUserById(id: string) {
    // each time get user is performed, aws call must be done to get the image

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException('User not found!');
    let userImage = { signed: '' };
    if (user.image) {
      userImage = await firstValueFrom(
        this.storageService.getSignedUrl({ key: user.image }),
      );
    }
    return { user, userImage: userImage.signed };
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }

  async setUserPhoto(imageFile: Buffer, userId: string) {
    // first try to upload it to the s3 bucket
    let imageKey = await firstValueFrom(
      this.storageService.uploadPhoto({
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
      id: userId,
      image: imageKey.key,
    });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepository.save(user);

    // remove sensitive field
    return { user: updatedUser, userImage: signedURL.signed };
  }

  async getUserSetting(id: string) {
    const userSettings = await this.settingsRepository.findOne({
      where: { user: { id } },
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

  // handle seen operations

  async addSeen(seenObject: UserSeenObject) {
    let seen = this.snapSeenRepo.create({
      snapId: seenObject.snapId,
      userId: seenObject.userId,
    });

    let savedSeen = await this.snapSeenRepo.save(seen);

    return savedSeen;
  }

  async getSeen(notSeenDTO: UserNotSeenObject) {
    const { seen, userId, snapIds } = notSeenDTO;

    return await this.snapSeenRepo.find({
      where: {
        userId: seen ? userId : Not(userId),
        ...(snapIds && snapIds.length > 0 && { snapId: In(snapIds) }),
      },
    });
  }
}
