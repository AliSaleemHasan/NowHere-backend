import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isDuplicateKeyError } from 'nowhere-common';
import { SnapBookmark } from './entities/snap-bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(SnapBookmark)
    private readonly bookmarkRepo: Repository<SnapBookmark>,
  ) {}

  async addBookmark(userId: string, snapId: string): Promise<SnapBookmark> {
    const existing = await this.bookmarkRepo.findOne({
      where: { userId, snapId },
    });
    if (existing) {
      return existing;
    }

    try {
      return await this.bookmarkRepo.save(
        this.bookmarkRepo.create({ userId, snapId }),
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const raced = await this.bookmarkRepo.findOne({
          where: { userId, snapId },
        });
        if (raced) {
          return raced;
        }
      }
      throw err;
    }
  }

  async removeBookmark(
    userId: string,
    snapId: string,
  ): Promise<{ success: true }> {
    await this.bookmarkRepo.delete({ userId, snapId });
    return { success: true };
  }

  listBookmarks(userId: string): Promise<SnapBookmark[]> {
    return this.bookmarkRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
