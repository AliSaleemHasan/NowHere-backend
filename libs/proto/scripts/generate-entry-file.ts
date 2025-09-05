import { readdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

function generateProtoEntryFile(
  dir: string = join(__dirname, '../generated/src/'),
) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));

  if (files.length === 0) {
    throw new Error('No proto generated files found in ' + dir);
  }

  const entryFilePath = join(dir, 'index.ts');

  let aliases: string[] = [];
  const exports =
    files
      .filter((filename) => !filename.includes('index'))
      .map((filename) => {
        const name = basename(filename, '.ts');
        let alias = `${name.split('-')[0].toUpperCase()}`;
        aliases.push(alias);
        return `import * as  ${alias} from "./${name}";`;
      })
      .join('\n') + `\nexport {${aliases.join(',')}};`;

  writeFileSync(entryFilePath, exports);
  console.log(`✅ Generated index.ts with ${files.length} exports`);
}

generateProtoEntryFile();
