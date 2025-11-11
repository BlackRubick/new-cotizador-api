#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found in project root');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);
const env = {};
for (const l of lines) {
  if (!l || l.trim().startsWith('#')) continue;
  const idx = l.indexOf('=');
  if (idx === -1) continue;
  const k = l.slice(0, idx);
  const v = l.slice(idx + 1);
  env[k] = v;
}

const required = ['DB_USER','DB_PASS','DB_HOST','DB_PORT','DB_NAME'];
for (const k of required) {
  if (!env[k]) {
    console.error(`Missing ${k} in .env`);
    process.exit(2);
  }
}

const dbUrl = `mysql://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

let found = false;
const out = lines.map(l => {
  if (l.startsWith('DB_URL=')) { found = true; return `DB_URL=${dbUrl}`; }
  return l;
});
if (!found) out.push(`DB_URL=${dbUrl}`);
fs.writeFileSync(envPath, out.join('\n'), 'utf8');
console.log('DB_URL written to .env:', dbUrl);
