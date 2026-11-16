import { successResponse, schemaRef } from "../helpers.js";

export const loggerPaths = {
  "/api/logger/test": {
    get: {
      tags: ["Logger"],
      summary: "Probar el logger (herramienta interna)",
      description: [
        "**Herramienta de validación del sistema de logs. NO es una funcionalidad de negocio.**",
        "",
        "Escribe un mensaje en cada nivel (`debug`, `http`, `info`, `warning`, `error` y `fatal`) y responde cuáles se registraron en el entorno actual. Sirve para comprobar que los logs aparecen en la consola y en los archivos de la carpeta `logs/`.",
        "",
        "No recibe parámetros ni body y no tiene respuestas de error propias."
      ].join("\n"),
      operationId: "testLogger",
      responses: {
        200: successResponse("Resultado de la prueba", schemaRef("LoggerTestResult"))
      }
    }
  }
};
