import path from "node:path";
import { fileURLToPath } from "node:url";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "./env.config.js";
import { ENVIRONMENTS } from "../constants/index.js";

// Logger centralizado de ShipNow (Winston).
// Se configura UNA sola vez acá y se usa desde cualquier archivo con:
//   import logger from "../config/logger.js";
//   logger.info("mensaje");

// ------------------------------------------------------------------
// Niveles
// ------------------------------------------------------------------
// Cuanto más bajo el número, más grave. Un logger con nivel "info" registra
// fatal, error, warning e info, y descarta http y debug.
export const LOG_LEVELS = Object.freeze({
  fatal: 0, // falla crítica: la app no puede seguir (ej: no conecta a MongoDB al arrancar)
  error: 1, // error inesperado del servidor
  warning: 2, // algo anormal pero esperado (ej: error de validación, ruta inexistente)
  info: 3, // eventos importantes (ej: servidor iniciado)
  http: 4, // cada petición HTTP recibida
  debug: 5 // detalle para desarrollar
});

const LOG_COLORS = {
  fatal: "magenta",
  error: "red",
  warning: "yellow",
  info: "green",
  http: "cyan",
  debug: "blue"
};
winston.addColors(LOG_COLORS);

// ------------------------------------------------------------------
// Comportamiento según el entorno (NODE_ENV, validado en env.config.js)
// ------------------------------------------------------------------
const LEVEL_BY_ENVIRONMENT = Object.freeze({
  [ENVIRONMENTS.DEVELOPMENT]: "debug", // desarrollo: se ve todo
  [ENVIRONMENTS.PRODUCTION]: "info", // producción: sin http ni debug
  [ENVIRONMENTS.TEST]: "warning" // tests: solo lo importante, para no ensuciar la salida
});

// Si la configuración es inválida (config es undefined) la app va a detenerse enseguida:
// se usa el nivel de desarrollo para que se vea el motivo.
const environment = config?.nodeEnv ?? ENVIRONMENTS.DEVELOPMENT;

// ------------------------------------------------------------------
// Formato: "2026-08-01 10:12:03 [info]    Mensaje"
// ------------------------------------------------------------------
const LEVEL_SYMBOL = Symbol.for("level"); // winston guarda acá el nivel sin colores
const MAX_LEVEL_LENGTH = Math.max(...Object.keys(LOG_LEVELS).map((level) => level.length));

const timestampFormat = winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" });

// Alinea los mensajes: "[info]    texto" y "[warning] texto"
const lineFormat = winston.format.printf((info) => {
  const padding = " ".repeat(MAX_LEVEL_LENGTH - info[LEVEL_SYMBOL].length + 1);
  return `${info.timestamp} [${info.level}]${padding}${info.message}`;
});

// En consola el nivel va con colores; en archivo, texto plano
const consoleFormat = winston.format.combine(timestampFormat, winston.format.colorize(), lineFormat);
const fileFormat = winston.format.combine(timestampFormat, lineFormat);

// ------------------------------------------------------------------
// Salidas (transports)
// ------------------------------------------------------------------
// La carpeta logs/ queda en la raíz del proyecto, sin importar desde dónde se ejecute node
const LOGS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../logs");

// Rotación: un archivo por día, máximo 10 MB cada uno, se conservan 14 días
// y los archivos viejos se comprimen (.gz).
const buildRotatingFile = (name, level) =>
  new DailyRotateFile({
    dirname: LOGS_DIR,
    filename: `${name}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "10m",
    maxFiles: "14d",
    level,
    format: fileFormat
  });

const transports = [new winston.transports.Console({ format: consoleFormat })];

// En tests no se escriben archivos
if (environment !== ENVIRONMENTS.TEST) {
  transports.push(
    buildRotatingFile("error", "error"), // logs/error-AAAA-MM-DD.log: SOLO error y fatal
    buildRotatingFile("combined", undefined) // logs/combined-AAAA-MM-DD.log: todos los niveles activos
  );
}

const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: LEVEL_BY_ENVIRONMENT[environment],
  transports
});

export default logger;
