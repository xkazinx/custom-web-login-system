// Builds the client for kazin.dev<base> and installs it on the server (deploy/deploy.json: app, base path,
// port, database, origin, ssh host).
//   node deploy/deploy.mjs [--host <ssh host>] [--no-build]
// The ssh host is --host, else DEPLOY_HOST, else deploy.json's (an alias in ~/.ssh/config).
// Nothing secret is sent: the server makes its own settings (deploy/install.sh).
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'deploy', 'deploy.json'), 'utf8'));
const args = process.argv.slice(2);
const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : (process.env.DEPLOY_HOST || cfg.host);
const { app, base, port, database, origin } = cfg;

function run(cmd, opts = {})
{
    console.log('> ' + cmd);
    execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

if(!args.includes('--no-build')) {
    run('npm run build', {
        cwd: path.join(root, 'client'),
        env: { ...process.env, PUBLIC_URL: base, REACT_APP_API_URL: base + '/api/', GENERATE_SOURCEMAP: 'false' },
    });
}

// The bundle: server (no node_modules, no local settings), common, the built client, the schema
const stage = fs.mkdtempSync(path.join(os.tmpdir(), app + '-'));
const dir = app + '-deploy';
const bundle = path.join(stage, dir);
fs.mkdirSync(bundle);
const skip = new Set(['node_modules', 'settings.json']);
fs.cpSync(path.join(root, 'server'), path.join(bundle, 'server'), { recursive: true, filter: src => !skip.has(path.basename(src)) });
fs.cpSync(path.join(root, 'common'), path.join(bundle, 'common'), { recursive: true });
fs.cpSync(path.join(root, 'client', 'build'), path.join(bundle, 'web'), { recursive: true });
fs.cpSync(path.join(root, 'deploy'), path.join(bundle, 'deploy'), { recursive: true });
fs.copyFileSync(path.join(root, 'database.sql'), path.join(bundle, 'database.sql'));

// Relative names from inside the stage: a tar or scp from Git reads "C:\..." as a remote host
run(`tar -czf bundle.tgz ${dir}`, { cwd: stage });
run(`scp -q bundle.tgz ${host}:/tmp/${dir}.tgz`, { cwd: stage });
run(`ssh ${host} "cd /tmp && rm -rf ${dir} && tar -xzf ${dir}.tgz && rm ${dir}.tgz && sudo bash ${dir}/deploy/install.sh ${app} ${base} ${port} ${database} ${origin}"`);
fs.rmSync(stage, { recursive: true, force: true });

console.log('\nLive at ' + origin + base + '/');
