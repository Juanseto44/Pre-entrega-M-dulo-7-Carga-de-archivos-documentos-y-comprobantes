import { openApiBase } from "./swagger.config.js";
import { schemas } from "./schemas.js";
import { responses } from "./responses.js";
import { usersPaths } from "./paths/users.paths.js";
import { productsPaths } from "./paths/products.paths.js";
import { ordersPaths } from "./paths/orders.paths.js";
import { deliveriesPaths } from "./paths/deliveries.paths.js";
import { mocksPaths } from "./paths/mocks.paths.js";
import { loggerPaths } from "./paths/logger.paths.js";

// Arma la especificación OpenAPI completa a partir de sus partes:
// información general, endpoints (uno por módulo), schemas y respuestas reutilizables.
export const swaggerSpec = {
  ...openApiBase,
  paths: {
    ...usersPaths,
    ...productsPaths,
    ...ordersPaths,
    ...deliveriesPaths,
    ...mocksPaths,
    ...loggerPaths
  },
  components: { schemas, responses }
};
