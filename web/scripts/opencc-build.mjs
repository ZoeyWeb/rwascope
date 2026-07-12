import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

// Post-process: 本站法律/金融语境, 单独"程式"=proceedings/程序义的 opencc 误转;
// "程式碼"=智能合约源码, 负向前瞻保留不动。
function postProcess(s) {
  return s.replace(/程式(?!碼)/g, '程序');
}

function convertValue(value) {
  if (typeof value === 'string') return postProcess(converter(value));
  if (Array.isArray(value)) return value.map(convertValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, convertValue(v)])
    );
  }
  return value;
}

const nsFiles = readdirSync(join(root, 'src/locales/zh-Hans')).filter(f => f.endsWith('.json'));
let totalChars = 0;

for (const file of nsFiles) {
  const src = readFileSync(join(root, 'src/locales/zh-Hans', file), 'utf-8');
  const json = JSON.parse(src);
  const converted = convertValue(json);
  const out = JSON.stringify(converted, null, 2) + '\n';
  writeFileSync(join(root, 'src/locales/zh-Hant', file), out, 'utf-8');
  totalChars += out.length;
}

console.log(`opencc-build: converted ${nsFiles.length} file(s), ${totalChars} chars → src/locales/zh-Hant/`);
