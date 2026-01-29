import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { setVersion, clearVersion } from './version-utils.js';
import { readPackageFileSync } from './package.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = joinPath(__dirname, '..');

const VERSION = '0.0.1';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      cwd: rootDir,
      ...options,
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

async function packageExistsOnNpm(packageName) {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['view', packageName], {
      stdio: 'ignore',
      cwd: rootDir,
    });
    proc.on('close', (code) => {
      resolve(code === 0);
    });
    proc.on('error', () => {
      resolve(false);
    });
  });
}

async function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function npmLogin() {
  console.log('\n--- npm login ---\n');
  await run('npm', ['login']);
}

async function npmPublish() {
  console.log('\n--- npm publish ---\n');

  // Get workspace paths from root package.json
  const root = readPackageFileSync(rootDir);
  const projectPaths = root.workspaces;

  for (const projectPath of projectPaths) {
    const project = readPackageFileSync(joinPath(rootDir, projectPath));
    if (project.private) {
      console.log(`Skipping private package: ${project.name}`);
      continue;
    }
    const exists = await packageExistsOnNpm(project.name);
    if (exists) {
      console.log(`Skipping ${project.name} (already exists on npm)`);
      continue;
    }
    console.log(`Publishing ${project.name}...`);
    await run('npm', ['publish', '--access', 'public'], {
      cwd: joinPath(rootDir, projectPath),
    });
  }
}

async function main() {
  try {
    // Step 1: Set version
    console.log(`\n--- Setting version to ${VERSION} ---\n`);
    setVersion(VERSION);

    // Step 2: npm login
    const answer = await prompt('\nDo you want to run npm login? (y/N): ');
    if (answer.toLowerCase() === 'y') {
      await npmLogin();
    }

    // Step 3: npm publish
    const publishAnswer = await prompt('\nProceed with npm publish? (y/N): ');
    if (publishAnswer.toLowerCase() !== 'y') {
      console.log('Publish cancelled.');
      return;
    }
    await npmPublish();

    console.log('\n--- Publish complete! ---\n');
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    // Step 4: Restore version
    console.log('\n--- Restoring version ---\n');
    clearVersion();
  }
}

main();
