#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getDeps(deps = {}) {
  return {
    spawnFn: deps.spawnFn || spawn,
    cliPath: deps.cliPath || `${__dirname}/cli.js`,
  };
}

export function runAcrWrapper(args = process.argv.slice(2), deps = {}) {
  const d = getDeps(deps);
  return d.spawnFn('node', ['--no-warnings', d.cliPath, ...args], {
    stdio: 'inherit',
  });
}

export function main(argv1 = process.argv[1], args = process.argv.slice(2), deps = {}) {
  if (argv1 && (argv1.endsWith('acr-wrapper.js') || argv1.endsWith('acr-wrapper'))) {
    return runAcrWrapper(args, deps);
  }
}

main();
