import { readdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

function generateProtoEntryFile(dir: string = join(__dirname, '../')) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));

  if (files.length === 0) {
    throw new Error('No proto generated files found in ' + dir);
  }

  const entryFilePath = join(dir, 'index.ts');

  const exports = files
    .filter((filename) => !filename.includes('index'))
    .map((filename) => {
      const name = basename(filename, '.ts');
      return `export * from "./${name}";`;
    })
    .join('\n');

  writeFileSync(entryFilePath, exports);
  console.log(`✅ Generated index.ts with ${files.length} exports`);
}

generateProtoEntryFile();
