import logger from "../config/logger.js";

// Registra cada petición HTTP con nivel "http": método, ruta, status y cuánto tardó.
// Se registra cuando la respuesta termina ("finish"), así se conoce el status final.
export const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - startTime}ms`);
  });

  next();
};
