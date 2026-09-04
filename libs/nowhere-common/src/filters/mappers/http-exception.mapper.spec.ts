import { ForbiddenException, HttpException } from '@nestjs/common';
import { ProblemCodes } from 'contracts';
import { httpProblem } from '../http-problem';
import { HttpExceptionMapper } from './http-exception.mapper';

describe('HttpExceptionMapper', () => {
  const mapper = new HttpExceptionMapper();

  it('copies a stable problem code from the exception body', () => {
    const exception = httpProblem(
      403,
      'You do not own this snap',
      ProblemCodes.SNAP_NOT_OWNED,
    );
    const problem = mapper.map(exception, '/snaps/1');
    expect(problem.status).toBe(403);
    expect(problem.title).toBe('Forbidden');
    expect(problem.detail).toBe('You do not own this snap');
    expect(problem.code).toBe(ProblemCodes.SNAP_NOT_OWNED);
  });

  it('omits code when the exception has none', () => {
    const exception = new ForbiddenException('nope');
    const problem = mapper.map(exception, '/snaps/1');
    expect(problem.code).toBeUndefined();
  });

  it('maps a string HttpException response without a code', () => {
    const exception = new HttpException('boom', 400);
    const problem = mapper.map(exception, '/x');
    expect(problem.detail).toBe('boom');
    expect(problem.code).toBeUndefined();
  });
});
