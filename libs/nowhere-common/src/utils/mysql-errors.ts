export function isDuplicateKeyError(error: unknown): boolean {
  const maybe = error as {
    code?: string;
    errno?: number;
    driverError?: { code?: string; errno?: number };
  };
  return (
    maybe?.code === 'ER_DUP_ENTRY' ||
    maybe?.errno === 1062 ||
    maybe?.driverError?.code === 'ER_DUP_ENTRY' ||
    maybe?.driverError?.errno === 1062
  );
}
