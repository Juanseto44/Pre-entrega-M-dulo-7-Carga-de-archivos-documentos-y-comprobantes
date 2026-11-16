import dotenv from "dotenv";
import { ENVIRONMENT_VALUES } from "../constants/index.js";

// Carga las variables de un archivo .env dentro de process.env.
// Si se ejecuta con NODE_ENV=test (npm test) se usa .env.test, para que los tests
// tengan su propia configuración y su propia base de datos, separada de la de desarrollo.
// Este es el UNICO archivo del proyecto que lee process.env: el resto de la
// aplicación importa el objeto `config` que se exporta al final.
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

const REQUIRED_VARS = ["PORT", "MONGODB_URI", "NODE_ENV"];

const isEmpty = (value) => value === undefined || value.trim() === "";

// Revisa que todas las variables críticas existan y tengan un valor razonable.
// Si algo falla, lanza un error que explica exactamente qué hay que corregir.
const loadConfig = () => {
  const missing = REQUIRED_VARS.filter((name) => isEmpty(process.env[name]));
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(", ")}. ` +
        "Revisá tu archivo .env (podés copiar .env.example como punto de partida)."
    );
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `La variable PORT debe ser un número de puerto válido (1-65535). Valor recibido: "${process.env.PORT}"`
    );
  }

  const nodeEnv = process.env.NODE_ENV.trim();
  if (!ENVIRONMENT_VALUES.includes(nodeEnv)) {
    throw new Error(
      `La variable NODE_ENV debe ser una de: ${ENVIRONMENT_VALUES.join(", ")}. Valor recibido: "${nodeEnv}"`
    );
  }

  // Object.freeze: nadie puede modificar la configuración mientras corre la app
  return Object.freeze({
    port,
    nodeEnv,
    mongodbUri: process.env.MONGODB_URI.trim()
  });
};

// Se valida una sola vez, al importar este archivo (o sea, al arrancar la app).
// Si la configuración es inválida NO se lanza el error acá: se guarda en `configError`
// para que server.js lo registre con el logger como un error fatal y detenga el arranque.
// (El logger necesita este archivo para funcionar, por eso no puede usarse acá adentro.)
let loadedConfig;
let loadError = null;

try {
  loadedConfig = loadConfig();
} catch (error) {
  loadError = error;
}

export const config = loadedConfig; // undefined si la configuración es inválida
export const configError = loadError; // null si la configuración es válida

export default config;
