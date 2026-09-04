import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProblemCodes } from 'contracts';
import { Snap, SnapResolution } from './schemas/snap.schema';
import { SnapsResolutionService } from './snaps-resolution.service';

describe('SnapsResolutionService', () => {
  let service: SnapsResolutionService;
  let snapModel: {
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const ownedSnap = {
    _id: 's1',
    _userId: 'owner',
    expiresAt: future,
    resolution: SnapResolution.OPEN,
  };

  beforeEach(async () => {
    snapModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedSnap),
      }),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsResolutionService,
        { provide: getModelToken(Snap.name), useValue: snapModel },
      ],
    }).compile();

    service = module.get(SnapsResolutionService);
  });

  it('allows a stranger to mark an active snap FOUND', async () => {
    const updated = {
      ...ownedSnap,
      resolution: SnapResolution.FOUND,
      resolvedBy: 'stranger',
      resolutionNote: 'saw it',
    };
    snapModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updated),
    });

    const result = await service.markFound('s1', 'stranger', 'saw it');

    expect(result.resolution).toBe(SnapResolution.FOUND);
    expect(result.resolvedBy).toBe('stranger');
    const updateCalls = snapModel.findByIdAndUpdate.mock
      .calls as unknown as Array<
      [
        string,
        {
          $set: {
            resolution: SnapResolution;
            resolvedBy: string;
            resolutionNote: string;
            resolvedAt: Date;
          };
        },
        { new: boolean },
      ]
    >;
    const [idArg, updateArg, optionsArg] = updateCalls[0];
    expect(idArg).toBe('s1');
    expect(updateArg.$set.resolution).toBe(SnapResolution.FOUND);
    expect(updateArg.$set.resolvedBy).toBe('stranger');
    expect(updateArg.$set.resolutionNote).toBe('saw it');
    expect(updateArg.$set.resolvedAt).toBeInstanceOf(Date);
    expect(optionsArg).toEqual({ new: true });
  });

  it('forbids a stranger from reopening', async () => {
    try {
      await service.reopen('s1', 'stranger');
      throw new Error('expected reopen to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.SNAP_NOT_OWNED,
        }),
      );
    }
    expect(snapModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('lets the author reopen', async () => {
    const updated = { ...ownedSnap, resolution: SnapResolution.OPEN };
    snapModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updated),
    });

    const result = await service.reopen('s1', 'owner');

    expect(result.resolution).toBe(SnapResolution.OPEN);
    expect(snapModel.findByIdAndUpdate).toHaveBeenCalledWith(
      's1',
      {
        $set: { resolution: SnapResolution.OPEN },
        $unset: { resolutionNote: 1, resolvedBy: 1, resolvedAt: 1 },
      },
      { new: true },
    );
  });

  it('rejects found on a missing snap', async () => {
    snapModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(service.markFound('missing', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
