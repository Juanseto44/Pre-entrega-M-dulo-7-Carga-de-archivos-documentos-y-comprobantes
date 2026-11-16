// Al importar config se validan las variables de entorno. Si hay un problema,
// no se lanza en ese momento: queda en `configError` y se registra más abajo como fatal.
import { config, configError } from "./config/env.config.js";
import logger from "./config/logger.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

// Tiempo máximo que se espera para que Winston termine de escribir el último log en el archivo
const FLUSH_TIME_MS = 500;

// Cierra con código de error (1) dando un instante para que el log fatal llegue al archivo.
// Si no queda nada pendiente, el proceso termina solo; el temporizador es un seguro.
const exitWithError = () => {
  process.exitCode = 1;
  setTimeout(() => process.exit(1), FLUSH_TIME_MS).unref();
};

const startServer = async () => {
  try {
    // Configuración inválida: la app no arranca
    if (configError) throw configError;

    // Primero la base de datos: si falla, el servidor no arranca
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${config.port} (entorno: ${config.nodeEnv})`);
    });
  } catch (error) {
    // Falla crítica: configuración inválida o conexión inicial a MongoDB
    logger.fatal(`No se pudo iniciar el servidor: ${error.message}`);
    exitWithError();
  }
};

startServer();
