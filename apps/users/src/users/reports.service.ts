import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportPayload, ProblemCodes } from 'contracts';
import { isDuplicateKeyError, throwHttpProblem } from 'nowhere-common';
import { SnapReport } from './entities/snap-report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SnapReport)
    private readonly reportRepo: Repository<SnapReport>,
  ) {}

  async createReport(payload: CreateReportPayload): Promise<SnapReport> {
    const existing = await this.reportRepo.findOne({
      where: { userId: payload.userId, snapId: payload.snapId },
    });
    if (existing) {
      this.throwDuplicate();
    }

    try {
      return await this.reportRepo.save(
        this.reportRepo.create({
          userId: payload.userId,
          snapId: payload.snapId,
          reason: payload.reason,
          details: payload.details,
        }),
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        this.throwDuplicate();
      }
      throw err;
    }
  }

  listByUser(userId: string): Promise<SnapReport[]> {
    return this.reportRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private throwDuplicate(): never {
    throwHttpProblem(
      HttpStatus.CONFLICT,
      'You already reported this snap',
      ProblemCodes.DUPLICATE_REPORT,
    );
  }
}
