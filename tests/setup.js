import mongoose from "mongoose";
import logger from "../src/config/logger.js";
import { configError } from "../src/config/env.config.js";
import { connectDB } from "../src/config/db.js";
import { assertTestDatabase, clearDatabase } from "./helpers/database.js";
import { clearUploads } from "./helpers/uploads.js";

// Hooks "raíz": mocha los ejecuta una vez para TODA la suite (se cargan con "file" en .mocharc.json).

// Los errores esperados (400, 404...) también generan logs; se silencian en la consola
// para que la salida muestre solo los resultados de los tests.
// (Para verlos, comentá la línea de abajo.)
logger.transports.forEach((transport) => {
  transport.silent = true;
});

before(async () => {
  // Si falta .env.test, config es inválida: se muestra el motivo claro
  if (configError) throw configError;

  await connectDB();

  try {
    assertTestDatabase();
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }

  await clearDatabase();
  await clearUploads();
});

after(async () => {
  // Limpieza final: la base de testing queda vacía, así la próxima corrida parte de cero
  if (mongoose.connection.readyState === 1) {
    await clearDatabase();
    await mongoose.disconnect();
    // Los archivos subidos por los tests también se borran
    await clearUploads();
  }
});