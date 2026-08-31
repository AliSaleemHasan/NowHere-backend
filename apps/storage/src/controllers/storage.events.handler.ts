import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StorageService } from '../storage.service';
import {
  StorageEvents,
  SnapUploadPayload,
  SnapUploadedEvent,
} from 'contracts';
import { JetStreamConsumerService, JetStreamPublisher } from 'nowhere-common';

@Injectable()
export class StorageEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(StorageEventsHandler.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly jsConsumer: JetStreamConsumerService,
    private readonly jsPublisher: JetStreamPublisher,
  ) {}

  async onModuleInit() {
    await this.jsConsumer.subscribe({
      stream: 'STORAGE_EVENTS',
      consumer: 'storage-snap-upload',
      filterSubject: StorageEvents.SNAP_UPLOAD,
      handler: this.handleSnapUpload.bind(this),
    });
  }

  private async handleSnapUpload(data: SnapUploadPayload) {
    this.logger.log(
      `Handling snap upload for snapId=${data.snapId}`,
    );

    const { keys, notSaved } = await this.storageService.saveLocalFiles(
      data.files as any,
      data.userId,
    );

    if (notSaved.length > 0) {
      const errorMessage = `Some files are not saved correctly: ${JSON.stringify(notSaved)}`;
      this.logger.error(errorMessage);

      await this.jsPublisher.publish<SnapUploadedEvent>(
        StorageEvents.SNAP_UPLOADED,
        {
          snapId: data.snapId,
          filesNames: data.files.map((file) => file.filename),
          error: errorMessage,
        },
      );
      return;
    }

    await this.jsPublisher.publish<SnapUploadedEvent>(
      StorageEvents.SNAP_UPLOADED,
      {
        snapId: data.snapId,
        filesNames: data.files.map((file) => file.filename),
        keys,
      },
    );

    this.logger.log(`Snap upload completed for snapId=${data.snapId}, keys=${keys.length}`);
  }
}
