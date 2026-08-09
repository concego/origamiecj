/**
 * export-diagrams.mjs - Exporta os diagramas dos modelos como arquivos SVG.
 *
 * Gera um SVG estático por passo de cada modelo em diagrams/<slug>/,
 * reutilizando o mesmo motor de diagramas da aplicação (js/diagrams.js).
 * Cada SVG inclui <title> e <desc> com a descrição acessível traduzida
 * (pt-BR por padrão).
 *
 * Uso:
 *   npm run export:diagrams
 *   node scripts/export-diagrams.mjs
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRenderState, buildResultState, renderDiagramSvg } from '../js/diagrams.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'diagrams');

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadJson(relPath) {
  const raw = await readFile(join(root, relPath), 'utf-8');
  return JSON.parse(raw);
}

async function exportModel(slug) {
  const model = await loadJson(`data/models/${slug}.json`);
  const dir = join(outDir, slug);
  await mkdir(dir, { recursive: true });

  const steps = model.steps || [];
  let count = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const state = buildRenderState(model, i);
    const title = step.title?.pt || `Passo ${step.id}`;
    const desc = step.diagramDescription?.pt || '';
    const svg = renderDiagramSvg(state, {
      uid: `${slug}-s${step.id}`,
      title,
      desc,
    });

    const file = join(dir, `${String(step.id).padStart(2, '0')}-${slugify(title)}.svg`);
    await writeFile(file, svg, 'utf-8');
    count += 1;
    // eslint-disable-next-line no-console
    console.log(`  ${slug}: passo ${step.id} -> ${file}`);
  }

  const resultState = buildResultState(model);
  const resultSvg = renderDiagramSvg(resultState, {
    uid: `${slug}-result`,
    title: model.title?.pt || 'Resultado',
    desc: model.result?.description?.pt || '',
  });
  const resultFile = join(dir, 'resultado.svg');
  await writeFile(resultFile, resultSvg, 'utf-8');
  count += 1;
  // eslint-disable-next-line no-console
  console.log(`  ${slug}: resultado -> ${resultFile}`);

  return count;
}

async function main() {
  const index = await loadJson('data/models/index.json');
  let total = 0;
  for (const slug of index.models) {
    total += await exportModel(slug);
  }
  // eslint-disable-next-line no-console
  console.log(`Exportados ${total} SVG(s) para diagrams/.`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Falha na exportação:', e);
  process.exit(1);
});
