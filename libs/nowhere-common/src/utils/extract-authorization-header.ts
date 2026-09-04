import { Request } from 'express';

export function extractBearerToken(
  authorization?: string,
): string | undefined {
  if (!authorization) {
    return undefined;
  }
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token ? token : undefined;
}

export function extractTokenFromHeader(request: Request): string | undefined {
  const header = request.headers.authorization;
  return extractBearerToken(Array.isArray(header) ? header[0] : header);
}
