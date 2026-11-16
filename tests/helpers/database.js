import mongoose from "mongoose";
import { config } from "../../src/config/env.config.js";

// Seguridad: la limpieza BORRA datos. Solo se permite sobre una base de testing:
// NODE_ENV=test y un nombre de base que contenga "test" (ej: shipnow_test).
export const assertTestDatabase = () => {
  const dbName = mongoose.connection.name;
  if (config?.nodeEnv !== "test" || !/test/i.test(dbName)) {
    throw new Error(
      `Por seguridad los tests solo corren sobre una base de testing (nombre con "test"). Base actual: "${dbName}". Revisá tu .env.test`
    );
  }
};

// Vacía todas las colecciones de la base de testing (usuarios, pedidos, entregas, productos)
export const clearDatabase = async () => {
  assertTestDatabase();
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};
