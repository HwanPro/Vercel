import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from './logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const cwd = path.join(__dirname, 'python-services');
const serverFile = path.join(cwd, 'server.py');

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const UVICORN_HOST = process.env.UVICORN_HOST || '127.0.0.1';
const UVICORN_PORT = process.env.UVICORN_PORT || '8010';
const RESTART_DELAY_MS = Number(process.env.PYTHON_RESTART_DELAY_MS || 5000);

if (!fs.existsSync(serverFile)) {
  logger.warn(`Servicio Python desactivado: no existe ${serverFile}.`);
  logger.warn('WolfGym usa ahora el servicio biométrico C# en 127.0.0.1:8001. No se reiniciará uvicorn.');
  process.exit(0);
}

let child = null;
let stopping = false;
let failures = 0;

function startPythonService() {
  logger.info(`Iniciando servicio Python (uvicorn) en ${UVICORN_HOST}:${UVICORN_PORT}...`);
  const uvicornArgs = ['-m', 'uvicorn', 'server:app', '--host', UVICORN_HOST, '--port', UVICORN_PORT];
  child = spawn(PYTHON_PATH, uvicornArgs, { cwd, env: process.env, shell: true });

  child.stdout.on('data', (data) => logger.info(`[uvicorn] ${data.toString().trim()}`));
  child.stderr.on('data', (data) => logger.error(`[uvicorn] ${data.toString().trim()}`));
  child.on('close', (code) => {
    if (stopping) return;
    failures += 1;
    const delay = Math.min(RESTART_DELAY_MS * failures, 30000);
    logger.warn(`uvicorn finalizó con código ${code}. Reiniciando en ${delay / 1000}s...`);
    setTimeout(startPythonService, delay);
  });
}

function shutdown() {
  stopping = true;
  if (child && !child.killed) child.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startPythonService();
