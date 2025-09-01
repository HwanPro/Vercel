import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import logger from './logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const cwd = path.join(__dirname, 'python-services');

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const UVICORN_HOST = process.env.UVICORN_HOST || '0.0.0.0';
const UVICORN_PORT = process.env.UVICORN_PORT || '8001';

logger.info(`Iniciando servicio de huellas (uvicorn) en ${UVICORN_HOST}:${UVICORN_PORT}...`);

const uvicornArgs = ['-m', 'uvicorn', 'server:app', '--host', UVICORN_HOST, '--port', UVICORN_PORT];
const child = spawn(PYTHON_PATH, uvicornArgs, { cwd, env: process.env, shell: true });

child.stdout.on('data', (data) => logger.info(`[uvicorn] ${data.toString().trim()}`));
child.stderr.on('data', (data) => logger.error(`[uvicorn] ${data.toString().trim()}`));
child.on('close', (code) => logger.warn(`uvicorn finalizó con código: ${code}`));
