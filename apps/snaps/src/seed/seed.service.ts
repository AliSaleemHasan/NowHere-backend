import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import {
  AuthPatterns,
  AuthResponse,
  SignupPayload,
  UsersPatterns,
} from 'contracts';
import { NATS_CLIENT, natsRequest, Tags } from 'nowhere-common';
import { Snap, SnapResolution, SnapStatus } from '../snaps/schemas/snap.schema';
import { addDays } from '../snaps/snaps-near-params';

const SEED_MARKER = '[nowhere-seed]';
const SEED_USER_COUNT = 8;
const POINTS_PER_REGION = 4;
const SEED_TTL_DAYS = 7;
const SEED_PASSWORD = 'Password123!';
const SEED_TAGS = [
  Tags.SOCIAL,
  Tags.INTERESTING,
  Tags.HIDDEN_GEM,
  Tags.FINDINGS,
  Tags.LOST,
  Tags.PROMOTION,
] as const;

type SeedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type SeedResult = {
  skipped: boolean;
  users: number;
  snaps: number;
};

const FIRST_NAMES = [
  'Ada',
  'Grace',
  'Linus',
  'Niels',
  'Marie',
  'Alan',
  'Hedy',
  'Nikola',
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Snap.name) private readonly snapsModel: Model<Snap>,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
  ) {}

  generateLocations(): number[][] {
    const regions: Record<string, [number, number]> = {
      hungary: [17.650397, 47.687457],
      netherlands: [4.904138, 52.367573],
      syria: [36.2765, 33.5138],
      italy: [12.496366, 41.902782],
      germany: [13.404954, 52.520008],
    };
    const earthKm = 6371;
    const radiusKm = 8;
    const points: number[][] = [];

    for (const [lng, lat] of Object.values(regions)) {
      for (let i = 0; i < POINTS_PER_REGION; i++) {
        const radiusInRad = radiusKm / earthKm;
        const bearing = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusInRad;
        const lat1 = (lat * Math.PI) / 180;
        const lng1 = (lng * Math.PI) / 180;
        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(distance) +
            Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing),
        );
        const lng2 =
          lng1 +
          Math.atan2(
            Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
            Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2),
          );
        points.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
      }
    }
    return points;
  }

  async seed(): Promise<SeedResult> {
    const removed = await this.snapsModel.deleteMany({
      $or: [
        { description: { $regex: /^\[nowhere-seed\]/ } },
        {
          description: {
            $regex: /^This is a small description for snap posted by a user/,
          },
        },
      ],
    });
    if (removed.deletedCount) {
      this.logger.log(`Removed ${removed.deletedCount} previous demo snaps.`);
    }

    const users = await this.ensureSeedUsers();
    if (users.length === 0) {
      this.logger.error('Seed created no users; not inserting snaps.');
      return { skipped: false, users: 0, snaps: 0 };
    }

    const now = new Date();
    const docs = this.generateLocations().map((coordinates, index) => {
      const user = users[index % users.length];
      return {
        _userId: user.id,
        description: `${SEED_MARKER} ${user.firstName} ${user.lastName}`,
        snaps: ['seed/placeholder.jpg'],
        location: { type: 'Point', coordinates },
        tag: SEED_TAGS[index % SEED_TAGS.length],
        status: SnapStatus.SUCCESS,
        resolution: SnapResolution.OPEN,
        expiresAt: addDays(now, SEED_TTL_DAYS),
      };
    });

    const inserted = await this.snapsModel.insertMany(docs, { ordered: false });
    this.logger.log(
      `Seeded ${inserted.length} snaps for ${users.length} users.`,
    );
    return { skipped: false, users: users.length, snaps: inserted.length };
  }

  private async ensureSeedUsers(): Promise<SeedUser[]> {
    const users: SeedUser[] = [];
    for (let i = 0; i < SEED_USER_COUNT; i++) {
      const firstName = FIRST_NAMES[i];
      const lastName = `Seed${i}`;
      const email = `seed.user.${i}@nowhere.test`;
      const created = await this.signupOrLoad({
        email,
        firstName,
        lastName,
      });
      if (created) users.push(created);
    }
    return users;
  }

  private async signupOrLoad(input: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<SeedUser | null> {
    try {
      const res = await natsRequest<AuthResponse, SignupPayload>(
        this.natsClient,
        AuthPatterns.SIGNUP,
        {
          email: input.email,
          password: SEED_PASSWORD,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      );
      if (res?.user?.id) {
        return {
          id: res.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        };
      }
    } catch {
      this.logger.warn(`Signup skipped for ${input.email}, loading existing.`);
    }

    try {
      const existing = await natsRequest<{ id: string }, { email: string }>(
        this.natsClient,
        UsersPatterns.GET_USER_BY_EMAIL,
        { email: input.email },
      );
      if (existing?.id) {
        return {
          id: existing.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        };
      }
    } catch (err) {
      this.logger.warn(
        `Could not resolve seed user ${input.email}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
    return null;
  }
}
