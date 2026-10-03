#!/usr/bin/env node
// Arranca el MCP de Playwright con el Chrome/Chromium que haya en la máquina.
// En Claude Code web no hay Chrome de sistema pero sí un Chromium en /opt/pw-browsers (y se corre como root,
// así que hace falta headless + sin sandbox). En la computadora de uno se deja el comportamiento por defecto.
const { spawn } = require('child_process');
const fs = require('fs');

const win = process.platform === 'win32';
const sinPantalla = process.env.CLAUDE_CODE_REMOTE === 'true' || (process.getuid && process.getuid() === 0);
const chrome = [process.env.PLAYWRIGHT_MCP_EXECUTABLE_PATH, process.env.CHROME_PATH, '/opt/pw-browsers/chromium'].filter(Boolean).find((p) => fs.existsSync(p));

const args = ['-y', '@playwright/mcp@latest'];
if (chrome) args.push('--executable-path', chrome);
if (sinPantalla) args.push('--headless', '--no-sandbox');

const hijo = spawn(win ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', shell: win });
hijo.on('exit', (codigo) => process.exit(codigo == null ? 1 : codigo));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => hijo.kill(s));
