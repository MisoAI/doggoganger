#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import nodemon from 'nodemon';

const __dirname = dirname(fileURLToPath(import.meta.url));

nodemon({
  script: resolve(__dirname, 'server.js'),
  watch: join(__dirname, '../src'),
  ext: 'js json yaml',
  verbose: true,
});

nodemon.on('log', ({ colour }) => {
  console.log(colour);
});

nodemon.on('quit', () => {
  process.exit();
});
