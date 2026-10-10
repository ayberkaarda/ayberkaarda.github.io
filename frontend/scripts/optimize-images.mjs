// Orijinal ekran görüntülerini (assets-src/projects) WebP'ye çevirir:
//   <ad>.webp       1600 px genişlik (proje sayfası)
//   <ad>-thumb.webp  720 px genişlik (ana sayfa listesi)
// Çıktı public/projects altına yazılır; orijinaller yayınlanmaz.
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const src = 'assets-src/projects';
const out = 'public/projects';
mkdirSync(out, { recursive: true });

for (const file of readdirSync(src)) {
  const { name, ext } = parse(file);
  if (!/\.(png|jpe?g)$/i.test(ext)) continue;
  const input = join(src, file);
  await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(out, `${name}.webp`));
  await sharp(input).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(out, `${name}-thumb.webp`));
  console.log(name.padEnd(24), `${(statSync(input).size / 1024).toFixed(0)} KB ->`,
    `${(statSync(join(out, `${name}.webp`)).size / 1024).toFixed(0)} KB / ${(statSync(join(out, `${name}-thumb.webp`)).size / 1024).toFixed(0)} KB`);
}
