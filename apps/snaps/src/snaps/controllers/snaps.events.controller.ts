import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StoragePatterns, SnapUploadedEvent } from 'contracts';
import { SnapsService } from '../snaps.service';

@Controller()
export class SnapsEventsController {
  constructor(private readonly snapsService: SnapsService) {}

  @MessagePattern(StoragePatterns.SNAP_UPLOADED)
  async handleSnapUploaded(@Payload() data: SnapUploadedEvent) {
    await this.snapsService.handleCreateSnap(data as any);
  }
}
