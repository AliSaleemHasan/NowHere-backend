export interface StreamDefinition {
  name: string;
  subjects: string[];
  maxAgeDays?: number;
}

/**
 * Streams to ensure on startup. Each stream captures all messages
 * published to its subjects, enabling durable at-least-once delivery.
 */
export const JETSTREAM_STREAMS: StreamDefinition[] = [
  {
    name: 'AUTH_EVENTS',
    subjects: ['auth.user.>'],
    maxAgeDays: 7,
  },
];
