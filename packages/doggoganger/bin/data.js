import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WORDS_YAML = resolve(__dirname, '../data/words.yaml');
const WORDS_JS = resolve(__dirname, '../src/data/words.js');

const words = yaml.load(readFileSync(WORDS_YAML, 'utf8'));
writeFileSync(WORDS_JS, `
// genereated by bin/data.js
export default ${JSON.stringify(words, null, 2)};
`);
