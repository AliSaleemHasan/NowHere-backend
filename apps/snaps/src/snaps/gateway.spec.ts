import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SnapsGateway } from './gateway';
import { haversineMeters } from 'nowhere-common';

describe('SnapsGateway', () => {
  let gateway: SnapsGateway;
  let serverMock: any;

  beforeEach(async () => {
    serverMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsGateway,
        {
          provide: JwtService,
          useValue: { verify: jest.fn().mockReturnValue({ user: { id: 'u1' } }) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    gateway = module.get<SnapsGateway>(SnapsGateway);
    gateway.server = serverMock;
    gateway.afterInit();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleDisconnect', () => {
    it('should remove client from map', () => {
      const client = { id: 'c1' } as any;
      gateway.usersLocationMap.set('c1', {
        socketId: 'c1',
        coordinates: [0, 0],
      });
      gateway.handleDisconnect(client);
      expect(gateway.usersLocationMap.has('c1')).toBeFalsy();
    });
  });

  describe('locationChange', () => {
    it('should update user location', () => {
      const client = { id: 'c1' } as any;
      const data = { coordinates: [1, 1] as [number, number] };
      gateway.locationChange(data, client);
      expect(gateway.usersLocationMap.get('c1')).toEqual({
        socketId: 'c1',
        coordinates: [1, 1],
      });
    });
  });

  describe('haversineMeters', () => {
    it('should calculate distance correctly', () => {
      const lat1 = 52.52;
      const lon1 = 13.405; // Berlin
      const lat2 = 48.8566;
      const lon2 = 2.3522; // Paris
      const distance = haversineMeters(lat1, lon1, lat2, lon2);
      expect(distance).toBeGreaterThan(800000);
      expect(distance).toBeLessThan(900000);
    });

    it('should return 0 for same location', () => {
      expect(haversineMeters(0, 0, 0, 0)).toBe(0);
    });
  });

  describe('findNearbyUsers', () => {
    it('should find users within radius', () => {
      gateway.usersLocationMap.set('u1', {
        socketId: 'u1',
        coordinates: [0, 0],
      }); // center
      gateway.usersLocationMap.set('u2', {
        socketId: 'u2',
        coordinates: [0.001, 0.001],
      }); // very close
      gateway.usersLocationMap.set('u3', {
        socketId: 'u3',
        coordinates: [10, 10],
      }); // far away

      const users = gateway.findNearbyUsers(0, 0, 10); // 10 km
      expect(users.length).toBe(2);
      expect(users.map((u) => u.socketId)).toContain('u1');
      expect(users.map((u) => u.socketId)).toContain('u2');
      expect(users.map((u) => u.socketId)).not.toContain('u3');
    });
  });

  describe('handleNewSnap', () => {
    it('should emit snap-added to nearby users', () => {
      gateway.usersLocationMap.set('u1', {
        socketId: 'u1',
        coordinates: [0, 0],
      });
      // handleNewSnap uses hardcoded 100km radius? verify source code
      // Source: findNearbyUsers(..., 100);

      const body = {
        location: { coordinates: [0, 0] as [number, number] },
      };

      gateway.handleNewSnap(body);

      expect(serverMock.to).toHaveBeenCalledWith('u1');
      expect(serverMock.emit).toHaveBeenCalledWith('snap-added', body);
    });
  });
});
