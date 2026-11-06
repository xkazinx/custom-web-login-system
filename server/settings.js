// Private settings (session secret, database login) live outside the repo.
// Read from, in order: the file named by APP_SETTINGS, ~/kazimgr_private/custom-web-login-system.json
// (kazimgr's private settings folder), server/settings.json (git-ignored). Missing keys take the
// defaults of settings.example.json.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

function ReadJson(file)
{
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    } catch(e) {
        if(e.code != 'ENOENT')
            console.error("settings: can't read " + file + ": " + e.message);
        return null;
    }
}

const candidates = [
    process.env.APP_SETTINGS,
    path.join(os.homedir(), 'kazimgr_private', 'custom-web-login-system.json'),
    path.join(here, 'settings.json'),
].filter(Boolean);

const defaults = ReadJson(path.join(here, 'settings.example.json')) || {};

let loaded = null;
let source = 'defaults';
for(const file of candidates) {
    loaded = ReadJson(file);
    if(loaded) {
        source = file;
        break;
    }
}

export const settings = {
    ...defaults,
    ...loaded,
    database: { ...defaults.database, ...(loaded && loaded.database) },
};

// No secret set: a random one per boot (sessions don't survive a restart, nothing to leak)
if(!settings.sessionSecret || settings.sessionSecret == defaults.sessionSecret)
    settings.sessionSecret = crypto.randomBytes(32).toString('hex');

console.log("settings: " + source);
