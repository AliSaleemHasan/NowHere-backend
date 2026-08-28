import { Inject, Injectable, Logger } from '@nestjs/common';
import { readdirSync } from 'fs';
import { join } from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Snap } from '../snaps/schemas/snap.schema';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  UsersPatterns,
  AuthPatterns,
  AuthResponse,
  SignupPayload,
} from 'contracts';
import { Tags } from 'nowhere-common/types/common-types';

@Injectable()
export class SeedService {
  private readonly logger: Logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Snap.name) private SnapsModel: Model<Snap>,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy,
  ) {}

  generateLocations = () => {
    const regions = {
      hungary: [17.650397, 47.687457],
      netherlands: [4.904138, 52.367573],
      syria: [36.2765, 33.5138],
      italy: [12.496366, 41.902782],
      germany: [13.404954, 52.520008],
    };

    const EARTH_RADIUS = 6371;
    const radiusKm = 20;
    const pointsPerRegion = 400;

    function generateRandomPoint(centerLng, centerLat, radiusKm) {
      const radiusInRad = radiusKm / EARTH_RADIUS;
      const bearing = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusInRad;

      const lat1 = deg2rad(centerLat);
      const lng1 = deg2rad(centerLng);

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

      return [rad2deg(lng2), rad2deg(lat2)];
    }

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    function rad2deg(rad) {
      return rad * (180 / Math.PI);
    }

    function generateAllLocations() {
      const allPoints: number[][] = [];
      for (const [region, [lng, lat]] of Object.entries(regions)) {
        for (let i = 0; i < pointsPerRegion; i++) {
          allPoints.push(generateRandomPoint(lng, lat, radiusKm));
        }
      }
      return allPoints;
    }

    return generateAllLocations();
  };

  generateNames(numOfUsers: number = 100): string[] {
    const names = [
      'ali',
      'yara',
      'yousef',
      'manar',
      'nisreen',
      'ahmad',
      'haidar',
      'yasmin',
      'aya',
      'leen',
      'hassan',
      'hasan',
      'husen',
      'adam',
      'manuel',
      'laszlo',
      'anees',
      'reema',
      'hala',
      'kareem',
      'selvester',
      'darwen',
      'zakaraia',
    ];

    const usersNames: string[] = [];
    for (let i = 0; i < numOfUsers; i++) {
      usersNames[i] =
        `${names[Math.floor(Math.random() * names.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }
    return usersNames;
  }

  async seed() {
    const user_names = this.generateNames();

    for (let i = 0; i < user_names.length; i++) {
      const name = user_names[i];
      try {
        await firstValueFrom(
          this.natsClient.send<AuthResponse, SignupPayload>(
            AuthPatterns.SIGNUP,
            {
              email: `${name.split(' ').join('_')}@test.com`,
              password: 'Password123!',
              firstName: name.split(' ')[0],
              lastName: name.split(' ')[1],
              role: 1 as any,
            },
          ),
        );
      } catch (e) {
        // user may already exist
      }
    }

    const usersRes = await firstValueFrom(
      this.natsClient.send<{
        users: Array<{
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        }>;
      }>(UsersPatterns.GET_ALL_USERS_INFO, {}),
    );
    const users = usersRes?.users || [];

    const locations = this.generateLocations();
    let uploadedSnaps: string[] = [];
    try {
      uploadedSnaps = readdirSync(join(__dirname, '..', '..', '..', 'uploads'));
    } catch {
      uploadedSnaps = ['default_snap.jpg'];
    }

    const new_snaps: Snap[] = [];
    for (let i = 0; i < locations.length; i++) {
      try {
        const current_user = users[i % users.length];
        if (!current_user?.id) continue;

        const newSnap = await this.SnapsModel.create({
          _userId: current_user.id,
          description: `This is a small description for snap posted by a user with name ${current_user.firstName} ${current_user.lastName} and email ${current_user.email}`,
          snaps: new Array(Math.floor(Math.random() * 4) || 1)
            .fill(null)
            .map(
              (_, index) =>
                `uploads/${uploadedSnaps[index % uploadedSnaps.length]}`,
            ),
          location: {
            type: 'Point',
            coordinates: locations[i],
          },
          tag: Tags[
            Object.keys(Tags)[
              Math.floor(Math.random() * Object.keys(Tags).length)
            ]
          ],
        });
        new_snaps.push(newSnap);
      } catch (e) {
        this.logger.error(e.message);
      }
    }
    return new_snaps;
  }
}
