import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { setVersion, clearVersion } from './version-utils.js';
import { readPackageFileSync } from './package.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = joinPath(__dirname, '..');

const VERSION = '0.0.1';
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dry');

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
  if (dryRun) {
    console.log('[dry-run] Would run: npm login');
    return;
  }
  await run('npm', ['login']);
}

async function getPackagesToPublish() {
  const root = readPackageFileSync(rootDir);
  const projectPaths = root.workspaces;
  const toPublish = [];
  const skipped = [];

  for (const projectPath of projectPaths) {
    const project = readPackageFileSync(joinPath(rootDir, projectPath));
    if (project.private) {
      skipped.push({ name: project.name, reason: 'private' });
      continue;
    }
    const exists = await packageExistsOnNpm(project.name);
    if (exists) {
      skipped.push({ name: project.name, reason: 'already exists on npm' });
      continue;
    }
    toPublish.push({ projectPath, name: project.name });
  }

  return { toPublish, skipped };
}

async function npmPublish(packages) {
  console.log('\n--- npm publish ---\n');

  for (const { projectPath, name } of packages) {
    if (dryRun) {
      console.log(`[dry-run] Would publish: ${name}`);
    } else {
      console.log(`Publishing ${name}...`);
      await run('npm', ['publish', '--access', 'public'], {
        cwd: joinPath(rootDir, projectPath),
      });
    }
  }
}

async function main() {
  if (dryRun) {
    console.log('\n*** DRY RUN MODE ***\n');
  }

  try {
    // Step 1: Set version (with backup for restoration)
    console.log(`\n--- Setting version to ${VERSION} ---\n`);
    setVersion(VERSION, { backup: true });

    // Step 2: npm login
    await npmLogin();

    // Step 3: Check packages to publish
    console.log('\n--- Checking packages ---\n');
    const { toPublish, skipped } = await getPackagesToPublish();

    for (const { name, reason } of skipped) {
      console.log(`  Skip: ${name} (${reason})`);
    }
    for (const { name } of toPublish) {
      console.log(`  Publish: ${name}`);
    }

    if (toPublish.length === 0) {
      console.log('\nNo packages to publish.');
      return;
    }

    // Step 4: Confirm and publish
    const publishAnswer = await prompt(`\nPublish ${toPublish.length} package(s)? (Y/n): `);
    if (publishAnswer.toLowerCase() === 'n') {
      console.log('Publish cancelled.');
      return;
    }
    await npmPublish(toPublish);

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
