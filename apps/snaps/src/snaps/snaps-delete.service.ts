import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { DeleteResult, Model } from 'mongoose';
import { isAdminRole, ProblemCodes, StoragePatterns } from 'contracts';
import { NATS_CLIENT, natsRequest, throwHttpProblem } from 'nowhere-common';
import { Snap } from './schemas/snap.schema';

@Injectable()
export class SnapsDeleteService {
  constructor(
    @InjectModel(Snap.name) private readonly snapModel: Model<Snap>,
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
  ) {}

  async deleteSnap(
    id: string,
    actor: { userId: string; role: string },
  ): Promise<DeleteResult> {
    const snap = await this.snapModel.findById(id).exec();
    if (!snap) {
      throw new NotFoundException('Snap not found for id: ' + id);
    }

    if (snap._userId !== actor.userId && !isAdminRole(actor.role)) {
      throwHttpProblem(
        HttpStatus.FORBIDDEN,
        'You do not own this snap',
        ProblemCodes.SNAP_NOT_OWNED,
      );
    }

    const keys = Array.isArray(snap.snaps) ? snap.snaps.filter(Boolean) : [];
    if (keys.length > 0) {
      await natsRequest<void, { keys: string[] }>(
        this.natsClient,
        StoragePatterns.DELETE_FILES,
        { keys },
      );
    }

    return this.snapModel.deleteOne({ _id: id });
  }

  deleteAll(): Promise<DeleteResult> {
    return this.snapModel.deleteMany({});
  }
}
