import { HttpException } from '@nestjs/common';
import { ProblemCodes } from 'contracts';
import { mapNatsError } from './nats-request';

describe('mapNatsError', () => {
  it('rebuilds an HttpException that still carries code', () => {
    expect.assertions(3);
    try {
      mapNatsError({
        statusCode: 403,
        message: 'You do not own this snap',
        code: ProblemCodes.SNAP_NOT_OWNED,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(403);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          statusCode: 403,
          message: 'You do not own this snap',
          code: ProblemCodes.SNAP_NOT_OWNED,
        }),
      );
    }
  });

  it('reads code from a nested RPC error payload', () => {
    expect.assertions(1);
    try {
      mapNatsError({
        message: {
          statusCode: 403,
          message: 'You do not own this snap',
          code: ProblemCodes.SNAP_NOT_OWNED,
        },
      });
    } catch (err) {
      expect((err as HttpException).getResponse()).toEqual(
        expect.objectContaining({ code: ProblemCodes.SNAP_NOT_OWNED }),
      );
    }
  });
});
