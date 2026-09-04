import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UsersPatterns, UserSettingsDto } from 'contracts';
import {
  MAX_DISTANCE_TO_SEE,
  MIN_DISTANCE_TO_POST,
  NATS_CLIENT,
  SNAP_DISAPPEAR_TIME,
  natsRequest,
} from 'nowhere-common';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SnapNearParams = {
  visionDistance: number;
  allowedPostDistance: number;
  snapDisappearDays: number;
};

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

export function resolveSnapNearParams(
  settings?: Pick<
    UserSettingsDto,
    'maxDistance' | 'newSnapDistance' | 'snapDisappearTime'
  > | null,
): SnapNearParams {
  return {
    visionDistance: settings?.maxDistance || MAX_DISTANCE_TO_SEE,
    allowedPostDistance: settings?.newSnapDistance || MIN_DISTANCE_TO_POST,
    snapDisappearDays: settings?.snapDisappearTime || SNAP_DISAPPEAR_TIME,
  };
}

@Injectable()
export class SnapsNearParamsService {
  private readonly logger = new Logger(SnapsNearParamsService.name);

  constructor(@Inject(NATS_CLIENT) private readonly natsClient: ClientProxy) {}

  async load(userId: string): Promise<SnapNearParams> {
    let settings: UserSettingsDto | null = null;
    if (userId) {
      try {
        settings = await natsRequest<UserSettingsDto, { id: string }>(
          this.natsClient,
          UsersPatterns.GET_SETTINGS,
          { id: userId },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to fetch user settings for ${userId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return resolveSnapNearParams(settings);
  }
}
