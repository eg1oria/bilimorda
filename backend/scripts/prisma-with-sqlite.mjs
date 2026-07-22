import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(import.meta.dirname, '..');
const envPath = join(projectRoot, '.env');

if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl?.startsWith('file:') && databaseUrl !== 'file::memory:') {
  const rawPath = decodeURIComponent(databaseUrl.slice(5).split('?')[0]);
  const databasePath = isAbsolute(rawPath)
    ? rawPath
    : resolve(projectRoot, 'prisma', rawPath);

  mkdirSync(dirname(databasePath), { recursive: true });
  closeSync(openSync(databasePath, 'a'));
}

const prismaCli = join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
