import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { readdirSync } from 'fs';
import { join } from 'path';
import { User } from '../users/entities/user.entity';
import { Snap, Tags } from '../snaps/snaps/schemas/snap.schema';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectModel(Snap.name) private SnapsModel: Model<Snap>,
  ) {}

  /**
   *
   * @returns numer[][] (list of locations of type [lng,lat]) in 5 countries (Syria,Hungary,Netherlands,Italy and Germany)
   *
   */
  generateLocations = () => {
    const regions = {
      hungary: [19.040235, 47.497913], // Budapest
      netherlands: [4.904138, 52.367573], // Amsterdam
      syria: [36.2765, 33.5138], // Damascus
      italy: [12.496366, 41.902782], // Rome
      germany: [13.404954, 52.520008], // Berlin
    };

    const EARTH_RADIUS = 6371; // km
    const radiusKm = 20; // 20 km radius
    const pointsPerRegion = 400; // 5 × 400 = 2000

    function generateRandomPoint(centerLng, centerLat, radiusKm) {
      // Convert radius from km to radians
      const radiusInRad = radiusKm / EARTH_RADIUS;

      // Random bearing and distance
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
  /**
   * @description Seeding new Users to the system with different locations for testing purposes
   * @async
   *
   */

  generateNames(numOfUsers: number = 100): string[] {
    let names = [
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

    let usersNames: string[] = [];

    for (let i = 0; i < numOfUsers; i++) {
      usersNames[i] =
        `${names[Math.floor(Math.random() * names.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }

    return usersNames;
  }

  async seed() {
    // first create users
    let user_names = this.generateNames();

    for (let i = 0; i < user_names.length; i++) {
      let name = user_names[i];
      try {
        let createdUser = this.userRepository.create({
          bio: `Hey There I am ${name} Welcome to my NowHere profile Page`,
          email: `${name.split(' ').join('_')}@test.com`,
          password: 'Qqqqq1!',
          first_name: name.split(' ')[0].toUpperCase(),
          last_name: name.split(' ')[1].toUpperCase(),
        });
        await this.userRepository.save(createdUser);
      } catch (e) {
        console.log(`Error seeding user ${name}`);
      }
    }

    const users = await this.userRepository.find();

    // now creating snaps for each user
    let locations = this.generateLocations();

    const uploadedSnaps = readdirSync(
      join(__dirname, '..', '..', '..', 'uploads'),
    );

    for (let i = 0; i < locations.length; i++) {
      let current_user = users[i % users.length];
      if (!current_user._id) continue;
      let newSnap = await this.SnapsModel.create({
        _userId: current_user._id,
        description: `This is a small description for snap posted by a user with name ${current_user.first_name} ${current_user.last_name} and email ${current_user.email}`,
        snaps: new Array(Math.floor(Math.random() * 4) || 1)
          .fill(null)
          .map((_, index) => `uploads/${uploadedSnaps[index]}`),
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
      newSnap.save();
    }
  }
}
