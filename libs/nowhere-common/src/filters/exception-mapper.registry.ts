import { HttpExceptionMapper } from './mappers/http-exception.mapper';
import { FallbackExceptionMapper } from './mappers/fallback-exception.mapper';
import { ExceptionMapper } from './problem-details.interface';

export class ExceptionMapperRegistry {
  private readonly mappers: ExceptionMapper<unknown>[] = [
    new HttpExceptionMapper(),
    new FallbackExceptionMapper(),
  ];

  public map(exception: unknown, requestUrl: string) {
    const mapper = this.mappers.find((mapper) => mapper.canHandle(exception));
    return mapper!.map(exception, requestUrl);
  }
}
