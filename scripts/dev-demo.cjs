const { spawn } = require('node:child_process');

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('Could not locate the npm CLI. Start this script with “npm run dev:demo”.');
  process.exit(1);
}
const services = [
  {
    name: 'ReturnHome backend (local demo auth enabled)',
    args: ['--prefix', 'backend', 'run', 'dev'],
    env: { DEV_AUTH_BYPASS: 'true' },
  },
  {
    name: 'ReturnHome frontend (local demo enabled)',
    args: ['--prefix', 'frontend', 'run', 'dev', '--', '--host', '127.0.0.1'],
    env: { VITE_DEV_AUTH_BYPASS: 'true' },
  },
];

const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = code;
}

console.log('Starting ReturnHome local demonstration. Demo identity is NOT VERIFIED; sample data is illustrative.');
console.log('Open http://127.0.0.1:5173. Public report storage still requires MongoDB.');

for (const service of services) {
  const child = spawn(process.execPath, [npmCli, ...service.args], {
    cwd: process.cwd(),
    env: { ...process.env, ...service.env },
    stdio: 'inherit',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`${service.name} could not start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
