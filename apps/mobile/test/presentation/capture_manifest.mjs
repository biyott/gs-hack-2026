import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = dirname(fileURLToPath(import.meta.url));
const root = resolve(folder, '../../../..');
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const collect = (dir) => readdirSync(dir).flatMap((name) => {
  const file = resolve(dir, name);
  return statSync(file).isDirectory() ? collect(file) : [file];
});
const files = readdirSync(resolve(folder, 'goldens')).filter((name) => name.endsWith('.png')).sort();
const images = files.map((file) => {
  const path = resolve(folder, 'goldens', file);
  const bytes = readFileSync(path);
  return {
    file,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    pngSignature: bytes.subarray(0, 8).toString('hex'),
    colorType: bytes[25],
    sha256: hash(path),
  };
});
const sourceDirs = [
  'apps/mobile/lib/features/safety_guidance/presentation',
  'apps/mobile/lib/theme',
  'apps/mobile/lib/l10n',
  'apps/mobile/test/presentation',
];
const sourceFiles = [
  ...sourceDirs.flatMap((dir) => collect(resolve(root, dir))).filter((file) => file.endsWith('.dart')),
  resolve(root, 'apps/mobile/assets/fonts/NotoSansKR-Variable.ttf'),
].sort();
const design = readFileSync(resolve(root, 'DESIGN.md'), 'utf8');
const designUi = design.slice(design.indexOf('## 1.'), design.indexOf('## 9.'));
const manifest = {
  capture: 'Flutter widget tester 3.47.5 Linux; fixture data; not Android hardware',
  capturedAt: new Date(Math.max(...files.map((file) => statSync(resolve(folder, 'goldens', file)).mtimeMs))).toISOString(),
  manifestGeneratedAt: new Date().toISOString(),
  count: images.length,
  designUiSections: 'DESIGN.md sections 1–8',
  designUiSha256: createHash('sha256').update(designUi).digest('hex'),
  images,
  sources: sourceFiles.map((file) => ({ file: relative(root, file), sha256: hash(file) })),
};
writeFileSync(resolve(folder, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${manifest.count} captures hashed at ${manifest.capturedAt}\n`);
