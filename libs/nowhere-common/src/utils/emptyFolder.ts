import { promises as fs } from 'fs';
import { join } from 'path';

export async function emptyFolder(directoryPath: string): Promise<void> {
  console.log(directoryPath);
  try {
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      const filePath = join(directoryPath, file);
      const stats = await fs.lstat(filePath);

      if (stats.isFile()) {
        await fs.unlink(filePath);
      } else if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      }
    }

    console.log(`Folder '${directoryPath}' emptied successfully.`);
  } catch (err) {
    console.error(`Error emptying folder '${directoryPath}':`, err);
  }
}
