// Punto de entrada alternativo de la configuración (src/config/index.js).
// La lógica real vive en env.config.js; este archivo solo la re-exporta.
export { config, configError, default } from "./env.config.js";
