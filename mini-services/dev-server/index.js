import { spawn } from 'child_process';
import path from 'path';

const projectDir = '/home/z/my-project';
const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: projectDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PATH: process.env.PATH }
});

child.stdout.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg) console.log(msg);
});

child.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg) console.error(msg);
});

child.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}, restarting in 3s...`);
  setTimeout(() => {
    process.exit(1); // Let the process manager restart
  }, 3000);
});

// Keep alive
setInterval(() => {
  if (child.exitCode !== null) {
    console.log('Child dead, exiting to trigger restart');
    process.exit(1);
  }
}, 5000);

console.log('Dev server wrapper started');
