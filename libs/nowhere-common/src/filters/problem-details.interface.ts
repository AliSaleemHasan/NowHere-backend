export interface ProblemDetails {
  // Request for comment error response format
  type: string;
  title: string;
  status: number;
  detail: string | string[] | Record<string, any>;
  instance: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ExceptionMapper<T = unknown> {
  canHandle(exception: unknown): boolean;

  map(exception: T, requestUrl: string): ProblemDetails;
}
