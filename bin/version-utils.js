import { fileURLToPath } from 'url';
import { writeFileSync, existsSync } from 'fs';
import { dirname, join as joinPath } from 'path';
import { readPackageFileSync, writePackageFileSync } from './package.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = joinPath(__dirname, '..');
const versionFileName = 'src/version.js';

export const VERSION_REGEXP = /^\d+\.\d+\.\d+(?:-beta\.\d+)?$/;

function writeVersionFile(path, version) {
  const filePath = joinPath(rootDir, path, versionFileName);
  if (existsSync(filePath)) {
    writeFileSync(filePath, `export default '${version}';`);
  }
}

function getProjects() {
  // read root package.json
  const root = readPackageFileSync(rootDir);

  // find workspaces
  const projectPaths = root.workspaces;
  const projects = [];
  const projectPathToModuleName = {};

  // collect some info
  for (const projectPath of projectPaths) {
    const project = readPackageFileSync(joinPath(rootDir, projectPath));
    !project.private && projects.push({ projectPath, project });
    projectPathToModuleName[projectPath] = project.name;
  }

  return { projects, projectPathToModuleName };
}

function overwriteDependencyVersions(dependencies, version, projectPathToModuleName) {
  if (!dependencies) {
    return;
  }
  for (const moduleName in dependencies) {
    const oldVersion = dependencies[moduleName];
    if (oldVersion === '*' || (oldVersion.startsWith('file:') && projectPathToModuleName[oldVersion.substring(5)] === moduleName)) {
      dependencies[moduleName] = version;
    }
  }
}

function restoreDependencyVersions(dependencies, projectPathToModuleName) {
  if (!dependencies) {
    return;
  }
  // Build reverse mapping: module name -> project path
  const moduleNameToProjectPath = {};
  for (const [projectPath, moduleName] of Object.entries(projectPathToModuleName)) {
    moduleNameToProjectPath[moduleName] = projectPath;
  }

  for (const moduleName in dependencies) {
    const projectPath = moduleNameToProjectPath[moduleName];
    if (projectPath) {
      // This is a workspace dependency, restore to file reference
      dependencies[moduleName] = `file:${projectPath}`;
    }
  }
}

export function setVersion(version) {
  const { projects, projectPathToModuleName } = getProjects();

  for (const { projectPath, project } of projects) {
    overwriteDependencyVersions(project.dependencies, version, projectPathToModuleName);
    overwriteDependencyVersions(project.devDependencies, version, projectPathToModuleName);
    overwriteDependencyVersions(project.peerDependencies, version, projectPathToModuleName);
    project.version = version;
    writePackageFileSync(joinPath(rootDir, projectPath), project);
    writeVersionFile(projectPath, version);
  }

  console.log(`Version set to ${version}`);
}

export function clearVersion() {
  const { projects, projectPathToModuleName } = getProjects();

  for (const { projectPath, project } of projects) {
    restoreDependencyVersions(project.dependencies, projectPathToModuleName);
    restoreDependencyVersions(project.devDependencies, projectPathToModuleName);
    restoreDependencyVersions(project.peerDependencies, projectPathToModuleName);
    delete project.version;
    writePackageFileSync(joinPath(rootDir, projectPath), project);
    writeVersionFile(projectPath, '0.0.0');
  }

  console.log(`Version cleared`);
}
