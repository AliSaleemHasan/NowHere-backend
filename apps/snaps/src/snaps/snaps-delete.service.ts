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

    await this.deleteStorageKeys(snap.snaps);
    return this.snapModel.deleteOne({ _id: id });
  }

  async deleteAll(): Promise<DeleteResult> {
    const docs = await this.snapModel.find().select('snaps').lean().exec();
    await this.deleteStorageKeys(docs.flatMap((doc) => doc.snaps || []));
    return this.snapModel.deleteMany({});
  }

  private async deleteStorageKeys(keys: string[] | undefined): Promise<void> {
    const unique = [
      ...new Set(
        (keys || []).filter((key) => typeof key === 'string' && key.length > 0),
      ),
    ];
    if (unique.length === 0) {
      return;
    }
    await natsRequest<void, { keys: string[] }>(
      this.natsClient,
      StoragePatterns.DELETE_FILES,
      { keys: unique },
    );
  }
}
