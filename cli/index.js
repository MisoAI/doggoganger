#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import nodemon from 'nodemon';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import doggoganger from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../src');

let { watch, ...argv } = yargs(hideBin(process.argv))
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
  .option('answer-format', {
    describe: 'Answer field format in answers API response',
    type: 'string',
  })
  .option('serve', {
    alias: 's',
    describe: 'Serve static files as well',
    type: 'boolean',
  })
  .argv;

const { port, serve, ['answer-format']: answerFormat } = argv;
argv = { port, serve, answerFormat };

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
