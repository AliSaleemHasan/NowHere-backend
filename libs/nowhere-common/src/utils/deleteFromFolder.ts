import { promises as fs } from 'fs';
import { join } from 'path';

export async function deleteFromFolder(
  directoryPath: string,
  fNames: string[],
): Promise<void> {
  try {
    for (const file of fNames) {
      const filePath = join(directoryPath, file);
      const stats = await fs.lstat(filePath);

      if (stats.isFile()) {
        await fs.unlink(filePath);
      } else if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error(`Error emptying folder '${directoryPath}':`, err);
  }
}
