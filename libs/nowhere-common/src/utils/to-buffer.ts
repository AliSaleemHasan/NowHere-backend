export function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return Buffer.from(value, 'base64');
  }
  if (value && typeof value === 'object' && 'data' in value) {
    const data = (value as { data: ArrayBuffer | number[] | Uint8Array }).data;
    return Buffer.from(data as ArrayBuffer);
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return Buffer.from(value as ArrayBuffer);
  }
  throw new TypeError('Unsupported binary payload');
}
