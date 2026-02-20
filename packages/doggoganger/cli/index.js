#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import nodemon from 'nodemon';
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
  const exec = `node ${resolve(__dirname, 'server.js')} ${JSON.stringify(JSON.stringify(argv))}`;
  nodemon({
    exec,
    watch: argv.static ? [SRC_DIR, '.'] : SRC_DIR,
    ignore: ['*/node_modules/*'],
    //ext: 'js json yaml',
    verbose: true,
  }).on('log', ({ colour }) => {
    console.log(colour);
  }).on('quit', () => process.exit());
  
} else {
  doggoganger(argv);
}
