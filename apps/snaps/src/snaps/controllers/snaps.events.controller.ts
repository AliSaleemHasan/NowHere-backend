import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StorageEvents, SnapUploadedEvent } from 'contracts';
import { JetStreamConsumerService } from 'nowhere-common';
import { SnapsService } from '../snaps.service';

@Injectable()
export class SnapsEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(SnapsEventsHandler.name);

  constructor(
    private readonly snapsService: SnapsService,
    private readonly jsConsumer: JetStreamConsumerService,
  ) {}

  async onModuleInit() {
    await this.jsConsumer.subscribe({
      stream: 'STORAGE_EVENTS',
      consumer: 'snaps-snap-uploaded',
      filterSubject: StorageEvents.SNAP_UPLOADED,
      handler: this.handleSnapUploaded.bind(this),
    });
  }

  private async handleSnapUploaded(data: SnapUploadedEvent) {
    this.logger.log(`Handling snap uploaded for snapId=${data.snapId}`);
    await this.snapsService.handleCreateSnap(data as any);
  }
}
