#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Resolving the current file's path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Running the CLI with --no-warnings
spawn('node', ['--no-warnings', `${__dirname}/cli.js`, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
