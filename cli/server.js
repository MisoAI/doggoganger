#!/usr/bin/env node
import { doggoganger } from '../src/index.js';

doggoganger(JSON.parse(process.argv[2]));
