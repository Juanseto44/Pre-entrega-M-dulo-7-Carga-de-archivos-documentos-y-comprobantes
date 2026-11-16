import logger, { LOG_LEVELS } from "../config/logger.js";
import { config } from "../config/env.config.js";

// Herramienta interna para comprobar que el logger funciona (no es parte del negocio).
// Escribe un mensaje en CADA nivel y devuelve qué niveles están activos en el entorno actual.

// De menor a mayor gravedad: debug, http, info, warning, error, fatal
const LEVELS_FROM_LOWEST = Object.keys(LOG_LEVELS).reverse();

export const testLogger = () => {
  for (const level of LEVELS_FROM_LOWEST) {
    logger[level](`Prueba del logger: mensaje de nivel ${level}`);
  }

  // Un nivel se registra si es tan grave como el nivel configurado, o más
  const levels = Object.fromEntries(
    LEVELS_FROM_LOWEST.map((level) => [level, LOG_LEVELS[level] <= LOG_LEVELS[logger.level]])
  );

  return {
    environment: config.nodeEnv,
    activeLevel: logger.level,
    levels // true = se registró; false = el entorno actual lo descarta
  };
};
