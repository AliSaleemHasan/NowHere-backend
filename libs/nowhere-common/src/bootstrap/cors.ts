export type CorsOrigin = string | string[] | boolean;

export function parseCorsOrigins(options?: {
  requireInProduction?: boolean;
  fallback?: CorsOrigin;
}): CorsOrigin {
  const origins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length === 1) {
    return origins[0];
  }
  if (origins.length > 1) {
    return origins;
  }

  if (process.env.NODE_ENV === 'production') {
    if (options?.requireInProduction) {
      throw new Error('CORS_ORIGIN is required in production');
    }
    return options?.fallback ?? false;
  }

  return options?.fallback ?? true;
}
