import { Injectable, Inject, Logger } from '@nestjs/common';
import { NatsConnection, JetStreamClient, JSONCodec, PubAck } from 'nats';

export const JETSTREAM_NC = 'JETSTREAM_NC';

@Injectable()
export class JetStreamPublisher {
  private readonly logger = new Logger(JetStreamPublisher.name);
  private readonly js: JetStreamClient;
  private readonly codec = JSONCodec();

  constructor(@Inject(JETSTREAM_NC) nc: NatsConnection) {
    this.js = nc.jetstream();
  }

  async publish<T>(subject: string, data: T): Promise<PubAck> {
    const encoded = this.codec.encode(data);
    const ack = await this.js.publish(subject, encoded);
    this.logger.debug(
      `Published to ${subject} → stream=${ack.stream} seq=${ack.seq}`,
    );
    return ack;
  }
}
