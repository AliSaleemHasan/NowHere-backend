import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SnapsPatterns, FindNearSnapsPayload, CreateSnapPayload } from 'contracts';
import { SnapsService } from '../snaps.service';
import { DeleteResult } from 'mongoose';

@Controller()
export class SnapsNatsController {
  constructor(private readonly snapsService: SnapsService) {}

  @MessagePattern(SnapsPatterns.FIND_ALL)
  async findAll() {
    return await this.snapsService.findAll();
  }

  @MessagePattern(SnapsPatterns.FIND_BY_TAGS)
  async findByTags(@Payload() data: { tags: any[] }) {
    return await this.snapsService.findByTags(data.tags);
  }

  @MessagePattern(SnapsPatterns.FIND_ONE)
  async findOne(@Payload() data: { id: string; userId: string }) {
    return await this.snapsService.findOne(data.id, data.userId);
  }

  @MessagePattern(SnapsPatterns.DELETE_ONE)
  async deleteOne(@Payload() data: { id: string }): Promise<DeleteResult> {
    return await this.snapsService.deleteSnap(data.id);
  }

  @MessagePattern(SnapsPatterns.DELETE_ALL)
  async deleteAll(): Promise<DeleteResult> {
    return await this.snapsService.deleteAll();
  }

  @MessagePattern(SnapsPatterns.FIND_NEAR)
  async findNear(@Payload() data: FindNearSnapsPayload) {
    return await this.snapsService.getSeenSnaps(
      {
        tags: data.tags as any,
        location: [Number(data.lng), Number(data.lat)],
      },
      data.userId,
      false,
    );
  }

  @MessagePattern(SnapsPatterns.FIND_SEEN)
  async findSeen(@Payload() data: FindNearSnapsPayload) {
    return await this.snapsService.getSeenSnaps(
      {
        tags: data.tags as any,
        location: [Number(data.lng), Number(data.lat)],
      },
      data.userId,
      true,
    );
  }

  @MessagePattern(SnapsPatterns.CREATE)
  async create(@Payload() data: CreateSnapPayload & { files?: any[] }) {
    return await this.snapsService.create(
      data.userId,
      (data.files || []) as any,
      data as any,
    );
  }
}
