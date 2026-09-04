import { ConflictException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProblemCodes } from 'contracts';
import { ReportsService } from './reports.service';
import { SnapReport } from './entities/snap-report.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: jest.Mocked<
    Pick<Repository<SnapReport>, 'findOne' | 'save' | 'create'>
  >;

  const payload = {
    userId: 'u1',
    snapId: 's1',
    reason: 'spam' as const,
    details: 'bot',
  };

  const saved: SnapReport = {
    ...payload,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(SnapReport), useValue: repo },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('creates a report', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(saved);
    repo.save.mockResolvedValue(saved);

    const result = await service.createReport(payload);

    expect(repo.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(saved);
  });

  it('returns 409 DUPLICATE_REPORT when the same user reports twice', async () => {
    repo.findOne.mockResolvedValue(saved);

    try {
      await service.createReport(payload);
      throw new Error('expected createReport to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      const exception = err as ConflictException;
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.DUPLICATE_REPORT,
        }),
      );
    }
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns 409 when the unique index rejects a concurrent insert', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(saved);
    repo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });

    await expect(service.createReport(payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
