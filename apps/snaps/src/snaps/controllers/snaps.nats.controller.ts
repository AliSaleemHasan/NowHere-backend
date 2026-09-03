import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SnapsPatterns,
  FindNearSnapsPayload,
  CreateSnapPayload,
  CreateSnapSchema,
  FindNearSnapsSchema,
  SnapIdPayloadSchema,
  validateSchema,
} from 'contracts';
import { Tags } from 'nowhere-common';
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
  async findByTags(@Payload() data: { tags: Tags[] }) {
    return await this.snapsService.findByTags(data.tags);
  }

  @MessagePattern(SnapsPatterns.FIND_ONE)
  async findOne(@Payload() data: { id: string; userId: string }) {
    const payload = validateSchema(SnapIdPayloadSchema, data);
    return await this.snapsService.findOne(payload.id, payload.userId || '');
  }

  @MessagePattern(SnapsPatterns.DELETE_ONE)
  async deleteOne(@Payload() data: { id: string }): Promise<DeleteResult> {
    const payload = validateSchema(SnapIdPayloadSchema.pick({ id: true }), data);
    return await this.snapsService.deleteSnap(payload.id);
  }

  @MessagePattern(SnapsPatterns.DELETE_ALL)
  async deleteAll(): Promise<DeleteResult> {
    return await this.snapsService.deleteAll();
  }

  @MessagePattern(SnapsPatterns.FIND_NEAR)
  async findNear(@Payload() data: FindNearSnapsPayload) {
    return this.queryNearby(data, false);
  }

  @MessagePattern(SnapsPatterns.FIND_SEEN)
  async findSeen(@Payload() data: FindNearSnapsPayload) {
    return this.queryNearby(data, true);
  }

  @MessagePattern(SnapsPatterns.CREATE)
  async create(@Payload() data: CreateSnapPayload) {
    const payload = validateSchema(CreateSnapSchema, data);
    return await this.snapsService.create(payload.userId, payload);
  }

  private queryNearby(data: FindNearSnapsPayload, seen: boolean) {
    const payload = validateSchema(FindNearSnapsSchema, data);
    return this.snapsService.getSeenSnaps(
      {
        tags: payload.tags as Tags[] | undefined,
        location: [Number(payload.lng), Number(payload.lat)],
      },
      payload.userId,
      seen,
    );
  }
}
