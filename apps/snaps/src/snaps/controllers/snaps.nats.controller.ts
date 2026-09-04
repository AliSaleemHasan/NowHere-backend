import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SnapsPatterns,
  FindNearSnapsPayload,
  CreateSnapPayload,
  CreateSnapSchema,
  DeleteSnapSchema,
  FindByUserSchema,
  FindNearSnapsSchema,
  MarkFoundSchema,
  ReopenSnapSchema,
  SnapIdPayloadSchema,
  validateSchema,
} from 'contracts';
import { Tags } from 'nowhere-common';
import { DeleteResult } from 'mongoose';
import { SnapsCreateService } from '../snaps-create.service';
import { SnapsDeleteService } from '../snaps-delete.service';
import { SnapsQueryService } from '../snaps-query.service';
import { SnapsResolutionService } from '../snaps-resolution.service';

@Controller()
export class SnapsNatsController {
  constructor(
    private readonly snapsQuery: SnapsQueryService,
    private readonly snapsCreate: SnapsCreateService,
    private readonly snapsDelete: SnapsDeleteService,
    private readonly snapsResolution: SnapsResolutionService,
  ) {}

  @MessagePattern(SnapsPatterns.FIND_ALL)
  async findAll() {
    return await this.snapsQuery.findAll();
  }

  @MessagePattern(SnapsPatterns.FIND_BY_TAGS)
  async findByTags(@Payload() data: { tags: Tags[] }) {
    return await this.snapsQuery.findByTags(data.tags);
  }

  @MessagePattern(SnapsPatterns.FIND_ONE)
  async findOne(@Payload() data: { id: string; userId: string }) {
    const payload = validateSchema(SnapIdPayloadSchema, data);
    return await this.snapsQuery.findOne(payload.id, payload.userId || '');
  }

  @MessagePattern(SnapsPatterns.FIND_BY_USER)
  async findByUser(@Payload() data: unknown) {
    const payload = validateSchema(FindByUserSchema, data);
    return await this.snapsQuery.findByUser(
      payload.userId,
      payload.includeExpired,
    );
  }

  @MessagePattern(SnapsPatterns.DELETE_ONE)
  async deleteOne(@Payload() data: unknown): Promise<DeleteResult> {
    const payload = validateSchema(DeleteSnapSchema, data);
    return await this.snapsDelete.deleteSnap(payload.id, {
      userId: payload.userId,
      role: payload.role,
    });
  }

  @MessagePattern(SnapsPatterns.DELETE_ALL)
  async deleteAll(): Promise<DeleteResult> {
    return await this.snapsDelete.deleteAll();
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
    return await this.snapsCreate.create(payload.userId, payload);
  }

  @MessagePattern(SnapsPatterns.MARK_FOUND)
  async markFound(@Payload() data: unknown) {
    const payload = validateSchema(MarkFoundSchema, data);
    return this.snapsResolution.markFound(
      payload.id,
      payload.userId,
      payload.note,
    );
  }

  @MessagePattern(SnapsPatterns.REOPEN)
  async reopen(@Payload() data: unknown) {
    const payload = validateSchema(ReopenSnapSchema, data);
    return this.snapsResolution.reopen(payload.id, payload.userId);
  }

  private queryNearby(data: FindNearSnapsPayload, seen: boolean) {
    const payload = validateSchema(FindNearSnapsSchema, data);
    return this.snapsQuery.getSeenSnaps(
      {
        tags: payload.tags as Tags[] | undefined,
        location: [Number(payload.lng), Number(payload.lat)],
      },
      payload.userId,
      seen,
    );
  }
}
