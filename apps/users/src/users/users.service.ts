import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { SnapSeen } from './entities/snaps-seen.entity';
import {
  CreateUserInfoPayload,
  StoragePatterns,
  UploadPhotoPayload,
  SignedUrlPayload,
} from 'contracts';
import { NATS_CLIENT, natsRequest } from 'nowhere-common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(SnapSeen) private snapSeenRepo: Repository<SnapSeen>,
    @Inject(NATS_CLIENT) private natsClient: ClientProxy,
  ) {}

  async createUser(createUserDto: CreateUserInfoPayload & { id?: string }) {
    const userId = createUserDto.id || createUserDto.authId;
    const email = createUserDto.email;

    const existing = await this.findByIdOrEmail(userId, email);
    if (existing) {
      return existing;
    }

    try {
      const user = this.userRepository.create({
        ...createUserDto,
        id: userId,
      });
      return await this.userRepository.save(user);
    } catch (err) {
      const raced = await this.findByIdOrEmail(userId, email);
      if (raced) {
        return raced;
      }
      throw err;
    }
  }

  private findByIdOrEmail(userId?: string, email?: string) {
    return this.userRepository.findOne({
      where: [
        ...(userId ? [{ id: userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    });
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async getUserWithImage(id: string) {
    const user = await this.getUserById(id);

    let signedUrl = '';
    if (user.image) {
      try {
        const res = await natsRequest<{ signed: string }, SignedUrlPayload>(
          this.natsClient,
          StoragePatterns.GET_SIGNED_URL,
          { key: user.image },
        );
        signedUrl = res?.signed || '';
      } catch (err) {
        this.logger.warn(
          `Failed to fetch signed url for user ${id}: ${err?.message}`,
        );
      }
    }
    return { user, userImage: signedUrl };
  }

  async getAllUsers() {
    return await this.userRepository.find();
  }

  async setUserPhoto(imageFile: Buffer, userId: string) {
    const imageKey = await natsRequest<{ key: string }, UploadPhotoPayload>(
      this.natsClient,
      StoragePatterns.UPLOAD_PHOTO,
      {
        image: imageFile,
        userId,
      },
    );

    if (!imageKey?.key)
      throw new BadRequestException('Error loading Image to storage');

    const signedURL = await natsRequest<{ signed: string }, SignedUrlPayload>(
      this.natsClient,
      StoragePatterns.GET_SIGNED_URL,
      { key: imageKey.key },
    );

    if (!signedURL)
      throw new BadRequestException('Error Getting image signedURL..');

    const user = await this.userRepository.preload({
      id: userId,
      image: imageKey.key,
    });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.userRepository.save(user);
    return { user: updatedUser, userImage: signedURL.signed };
  }

  async addSeen(seenObject: { snapId: string; userId: string }) {
    const seen = this.snapSeenRepo.create({
      snapId: seenObject.snapId,
      userId: seenObject.userId,
    });

    return await this.snapSeenRepo.save(seen);
  }

  async getSeen(notSeenDTO: {
    seen?: boolean;
    userId: string;
    snapIds?: string[];
  }) {
    const { userId, snapIds } = notSeenDTO;

    return await this.snapSeenRepo.find({
      where: {
        userId,
        ...(snapIds && snapIds.length > 0 && { snapId: In(snapIds) }),
      },
    });
  }
}
