export interface ProblemDetails {
  // RFC 9457 Problem Details error response format
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ExceptionMapper<T = unknown> {
  canHandle(exception: unknown): boolean;

  map(exception: T, requestUrl: string): ProblemDetails;
}
