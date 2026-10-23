#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { spawn } from 'child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { doggoganger, version } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../src');

let { watch, ...argv } = yargs(hideBin(process.argv))
  .version(version)
  .option('verbose', {
    alias: 'v',
    describe: 'Be verbose',
    type: 'boolean',
  })
  .option('port', {
    alias: 'p',
    describe: 'Port of mock API endpoint',
    default: 9901,
    type: 'number',
  })
  .option('watch', {
    alias: 'w',
    describe: 'Watch files for changes',
    type: 'boolean',
  })
  .option('serve', {
    alias: 's',
    describe: 'Serve static files as well',
    type: 'boolean',
  })
  .argv;

const { verbose, port, serve } = argv;
argv = { verbose, port, serve };

if (watch) {
  const child = spawn(process.execPath, [
    `--watch-path=${SRC_DIR}`,
    resolve(__dirname, 'server.js'),
    JSON.stringify(argv),
  ], { stdio: 'inherit' }).on('exit', code => process.exit(code ?? 0));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
  }

} else {
  doggoganger(argv);
}
