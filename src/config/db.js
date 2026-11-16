import mongoose from "mongoose";
import config from "./env.config.js";
import logger from "./logger.js";

// Conecta la aplicación con MongoDB usando la URI ya validada en config
export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
  } catch (error) {
    // Se deja el motivo claro y se conserva el error original; server.js lo registra como fatal
    throw new Error(`No se pudo conectar a MongoDB: ${error.message}`, { cause: error });
  }

  logger.info("Conexión a MongoDB establecida");
};
