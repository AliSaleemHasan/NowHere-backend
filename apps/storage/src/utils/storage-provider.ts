export function isGcpStorageProvider(provider?: string): boolean {
  const value = (provider || 'aws').toLowerCase();
  return value === 'gcp' || value === 'gcs' || value === 'google';
}
