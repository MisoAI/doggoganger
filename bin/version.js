import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const VERSION_REGEXP = /^\d+\.\d+\.\d+(?:-beta\.\d+)?$/;
const version = process.argv[2];

if (!version) {
  console.log(`Usage: npm run version [version]`);
  process.exit();
}
if (!VERSION_REGEXP.test(version)) {
  console.error(`Illegal version: ${version}`);
  process.exit(1);
}

const rootDir = join(__dirname, '..');
//const VERSION_FILE_NAME = 'src/version.js';
const PACKAGE_FILE_NAME = 'package.json';

/*
function writeVersionFile(path, version) {
  const filePath = join(rootDir, path, VERSION_FILE_NAME);
  if (existsSync(filePath)) {
    writeFileSync(filePath, `export default '${version}';`);
  }
}
*/

function readPackageFileSync(path) {
  const file = join(path, PACKAGE_FILE_NAME);
  return existsSync(file) ? JSON.parse(readFileSync(file)) : undefined;
}

function writePackageFileSync(path, data) {
  const file = join(path, PACKAGE_FILE_NAME);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
  }
  writeFileSync(join(path, PACKAGE_FILE_NAME), JSON.stringify(data, null, 2));
}

const { name, version: _version, ...project } = readPackageFileSync(rootDir);
writePackageFileSync(rootDir, { name, version, ...project });
