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

  it('uses Locked as the title for 423 ACCOUNT_LOCKED', () => {
    const exception = httpProblem(
      423,
      'Account is locked',
      ProblemCodes.ACCOUNT_LOCKED,
    );
    const problem = mapper.map(exception, '/auth/login');
    expect(problem.status).toBe(423);
    expect(problem.title).toBe('Locked');
    expect(problem.detail).toBe('Account is locked');
    expect(problem.code).toBe(ProblemCodes.ACCOUNT_LOCKED);
  });
});
