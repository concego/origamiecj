/**
 * validate.mjs - Validação dos dados e da estrutura do OrigamiECJ.
 *
 * Verifica, sem precisar de navegador:
 *  1. Que todos os JSON (dicionários, modelos, índice) são válidos;
 *  2. Que os dicionários pt-BR e en têm as mesmas chaves;
 *  3. Que cada modelo referenciado no índice existe e é coerente
 *     (steps presentes, ids sequenciais, diagramas com campos mínimos);
 *  4. Que as referências de idioma nos modelos (pt/en) estão completas.
 *
 * Uso:
 *   npm test
 *   node scripts/validate.mjs
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

let errors = 0;
const errorsLog = [];

function fail(msg) {
  errors += 1;
  errorsLog.push(msg);
}

async function readJson(relPath) {
  try {
    const raw = await readFile(join(root, relPath), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    fail(`${relPath}: não é um JSON válido (${e.message})`);
    return null;
  }
}

/** Percorre um objeto e coleta as chaves pontilhadas (básico, sem arrays). */
function collectKeys(obj, prefix = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      collectKeys(v, key, out);
    } else {
      out.push(key);
    }
  }
  return out;
}

function diffKeys(a, b, labelA, labelB) {
  const onlyA = a.filter((k) => !b.includes(k));
  const onlyB = b.filter((k) => !a.includes(k));
  if (onlyA.length) fail(`Chaves só em ${labelA}: ${onlyA.join(', ')}`);
  if (onlyB.length) fail(`Chaves só em ${labelB}: ${onlyB.join(', ')}`);
}

const REQUIRED_MODEL_FIELDS = [
  'slug',
  'difficulty',
  'category',
  'durationMinutes',
  'totalSteps',
  'paper',
  'title',
  'description',
  'result',
  'credit',
  'steps',
];

const REQUIRED_STEP_FIELDS = ['id', 'title', 'diagram', 'aspects', 'diagramDescription'];

const ASPECT_KEYS = [
  'position',
  'orientation',
  'moving',
  'direction',
  'expected',
  'commonError',
  'correction',
  'followUp',
];

async function validateModels() {
  const index = await readJson('data/models/index.json');
  if (!index || !Array.isArray(index.models)) {
    fail('data/models/index.json: "models" não é um array');
    return;
  }
  for (const slug of index.models) {
    const model = await readJson(`data/models/${slug}.json`);
    if (!model) continue;

    for (const field of REQUIRED_MODEL_FIELDS) {
      if (!(field in model)) fail(`${slug}: falta o campo "${field}"`);
    }

    if (model.slug !== slug) fail(`${slug}: slug "${model.slug}" difere do nome do arquivo`);

    const steps = model.steps;
    if (Array.isArray(steps)) {
      if (steps.length === 0) fail(`${slug}: steps vazio`);
      steps.forEach((step, i) => {
        for (const field of REQUIRED_STEP_FIELDS) {
          if (!(field in step)) fail(`${slug}: passo ${i + 1} sem o campo "${field}"`);
        }
        if (step.id !== i + 1) {
          fail(`${slug}: passo ${i + 1} tem id ${step.id} (esperado ${i + 1})`);
        }
        for (const k of ASPECT_KEYS) {
          const v = step.aspects?.[k];
          if (v !== undefined && !(v.pt && v.en)) {
            fail(`${slug}: passo ${i + 1} "aspects.${k}" precisa de "pt" e "en"`);
          }
        }
        const d = step.diagram || {};
        if (!d.outline && !d.base) {
          fail(`${slug}: passo ${i + 1} diagrama sem "outline" nem "base"`);
        }
      });
      if (model.totalSteps !== steps.length) {
        fail(`${slug}: totalSteps ${model.totalSteps} difere de ${steps.length}`);
      }
    }
  }
}

async function validateDicts() {
  const pt = await readJson('data/i18n/pt-BR.json');
  const en = await readJson('data/i18n/en.json');
  if (!pt || !en) return;
  diffKeys(collectKeys(pt), collectKeys(en), 'pt-BR', 'en');
}

async function main() {
  await validateDicts();
  await validateModels();

  if (errors > 0) {
    // eslint-disable-next-line no-console
    console.error(`Falhou com ${errors} erro(s):`);
    for (const msg of errorsLog) console.error(`  - ${msg}`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('Validação OK: dicionários e modelos coerentes.');
}

main();
