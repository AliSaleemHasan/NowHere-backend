import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProblemCodes } from 'contracts';
import { throwHttpProblem } from 'nowhere-common';
import { Snap, SnapResolution } from './schemas/snap.schema';

function snapJson(doc: { toJSON?: () => unknown }): Record<string, unknown> {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return json as Record<string, unknown>;
}

@Injectable()
export class SnapsResolutionService {
  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
  ) {}

  async markFound(id: string, userId: string, note?: string) {
    await this.requireActiveSnap(id);

    const $set: Record<string, unknown> = {
      resolution: SnapResolution.FOUND,
      resolvedBy: userId,
      resolvedAt: new Date(),
    };
    if (note !== undefined) {
      $set.resolutionNote = note;
    }

    const updated = await this.snapModel
      .findByIdAndUpdate(id, { $set }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Snap not found for id: ' + id);
    }
    return snapJson(updated);
  }

  async reopen(id: string, userId: string) {
    const snap = await this.requireActiveSnap(id);
    if (snap._userId !== userId) {
      throwHttpProblem(
        HttpStatus.FORBIDDEN,
        'You do not own this snap',
        ProblemCodes.SNAP_NOT_OWNED,
      );
    }

    const updated = await this.snapModel
      .findByIdAndUpdate(
        id,
        {
          $set: { resolution: SnapResolution.OPEN },
          $unset: { resolutionNote: 1, resolvedBy: 1, resolvedAt: 1 },
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('Snap not found for id: ' + id);
    }
    return snapJson(updated);
  }

  private async requireActiveSnap(id: string) {
    const snap = await this.snapModel.findById(id).exec();
    if (!snap || this.isExpired(snap.expiresAt)) {
      throw new NotFoundException('Snap not found for id: ' + id);
    }
    return snap;
  }

  private isExpired(expiresAt?: Date) {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }
}
