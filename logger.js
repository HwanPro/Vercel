import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createLogger, format, transports } from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env
dotenv.config({ path: path.join(__dirname, ".env") });

const defaultLogFile = path.join(__dirname, "logs", "app.log");
const logFile = process.env.LOG_FILE || defaultLogFile;
const logLevel = process.env.LOG_LEVEL || "debug";

// asegurar carpeta de logs
const logsDir = path.dirname(logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ level, message, timestamp }) =>
        `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [
    new transports.Console({ level: "info" }),
    new transports.File({ filename: logFile, level: "debug" })
  ]
});

export default logger;
