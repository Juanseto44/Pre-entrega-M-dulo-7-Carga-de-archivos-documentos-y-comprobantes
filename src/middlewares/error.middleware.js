import logger from "../config/logger.js";
import { AppError, RouteNotFoundError, ERROR_CODES } from "../errors/index.js";

// Estas dos funciones son los ÚNICOS lugares de la aplicación que responden un error al cliente.
// Los services detectan el problema y lanzan un error; los controllers lo pasan con next(error);
// y acá se transforma en una respuesta HTTP con siempre la misma estructura.
// Además, cada error se registra con el logger (el logger complementa la respuesta, no la reemplaza).

// Se ejecuta cuando ninguna ruta coincide con la petición.
// No responde: crea el error y lo deriva al errorHandler.
export const notFoundHandler = (req, res, next) => {
  next(new RouteNotFoundError(req.method, req.originalUrl));
};

// Convierte cualquier error en un AppError conocido
const normalizeError = (error) => {
  // Error esperado del dominio: ya trae código, status y mensaje
  if (error instanceof AppError) return error;

  // JSON mal formado en el body (lo detecta express.json())
  if (error.type === "entity.parse.failed") {
    return new AppError(ERROR_CODES.INVALID_JSON);
  }

  // Cualquier otra cosa es un error inesperado: no se muestran sus detalles al cliente
  return new AppError(ERROR_CODES.INTERNAL_ERROR, undefined, { cause: error });
};

// Registra el error según su gravedad:
//  - Errores esperados / de negocio (4xx): warning, en una línea.
//  - Errores del servidor (5xx): error, con el stack del error ORIGINAL (por ejemplo, el de MongoDB).
const logError = (appError, req) => {
  const context = `${req.method} ${req.originalUrl}`;
  const summary = `${appError.code} en ${context}: ${appError.message}`;

  if (appError.statusCode >= 500) {
    const origin = appError.cause ?? appError;
    logger.error(`${summary}\n${origin.stack ?? origin}`);
  } else {
    logger.warning(summary);
  }
};

// Captura cualquier error que llegue con next(error).
// Tiene 4 parámetros: así Express lo reconoce como manejador de errores.
export const errorHandler = (error, req, res, next) => {
  const appError = normalizeError(error);

  logError(appError, req);

  // Estructura única de TODAS las respuestas de error
  res.status(appError.statusCode).json({
    status: "error",
    code: appError.code,
    message: appError.message,
    details: appError.details
  });
};
