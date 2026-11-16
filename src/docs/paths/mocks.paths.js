import { ERROR_CODES } from "../../errors/index.js";
import { MOCK_TYPES, MOCK_TYPE_VALUES, MOCK_LIMITS } from "../../constants/index.js";
import { errorExample, errorResponse, plainResponse, qtyParameter, schemaRef, responseRef } from "../helpers.js";
import { invalidQuantityExample, negativeQuantityExample } from "../examples.js";

const TAG = "Mocks";

const qtyErrors = errorResponse(
  `\`qty\` inválido: no es un número entero, es 0, es mayor a ${MOCK_LIMITS.MAX_QTY} o es negativo`,
  invalidQuantityExample,
  negativeQuantityExample
);

// Los GET devuelven los datos directamente (un array), sin guardar nada
const mockGet = ({ summary, description, operationId, itemSchema, qtyDescription }) => ({
  tags: [TAG],
  summary,
  description: `${description} **No se guarda nada en la base.**`,
  operationId,
  parameters: [qtyParameter(qtyDescription)],
  responses: {
    200: plainResponse("Datos simulados", { type: "array", items: schemaRef(itemSchema) }),
    400: qtyErrors,
    500: responseRef("MockGenerationFailed")
  }
});

export const mocksPaths = {
  "/api/mocks/users": {
    get: mockGet({
      summary: "Generar usuarios simulados",
      description: "Genera usuarios con un rol válido al azar (`admin`, `user` o `courier`) y emails únicos.",
      operationId: "getMockUsers",
      itemSchema: "MockUser",
      qtyDescription: "Cantidad de usuarios a generar"
    })
  },
  "/api/mocks/couriers": {
    get: mockGet({
      summary: "Generar repartidores simulados",
      description: "Genera usuarios con rol `courier`.",
      operationId: "getMockCouriers",
      itemSchema: "MockUser",
      qtyDescription: "Cantidad de repartidores a generar"
    })
  },
  "/api/mocks/orders": {
    get: mockGet({
      summary: "Generar pedidos simulados",
      description:
        "Genera pedidos con entre 1 y 4 items, estado y prioridad válidos. El campo `user` es un id inventado, porque no se guardan usuarios.",
      operationId: "getMockOrders",
      itemSchema: "MockOrder",
      qtyDescription: "Cantidad de pedidos a generar"
    })
  },
  "/api/mocks/deliveries": {
    get: mockGet({
      summary: "Generar entregas simuladas",
      description:
        "Genera entregas con su estado y, si ya salieron, un repartidor. Los campos `order` y `courier` son ids inventados.",
      operationId: "getMockDeliveries",
      itemSchema: "MockDelivery",
      qtyDescription: "Cantidad de entregas a generar"
    })
  },

  "/api/mocks/seed": {
    post: {
      tags: [TAG],
      summary: "Cargar datos de prueba en MongoDB",
      description: [
        "Genera datos de prueba y los **guarda** en MongoDB. **No recibe body**: los parámetros `type` y `qty` van por query.",
        "",
        "Cada tipo usa datos que ya deben estar guardados, por eso conviene cargarlos en este orden:",
        "1. `users` y `couriers` (no necesitan nada previo).",
        "2. `orders`: se asigna a usuarios con rol `user` existentes.",
        "3. `deliveries`: se crea sobre pedidos existentes que no estén cancelados y no tengan entrega. Si hay menos pedidos disponibles que `qty`, se insertan solo los posibles. Las entregas ya salidas usan repartidores (rol `courier`) existentes.",
        "",
        "Si se envía `type` repetido o inválido, o `qty` inválido, no se guarda nada."
      ].join("\n"),
      operationId: "seedMocks",
      parameters: [
        {
          name: "type",
          in: "query",
          required: false,
          description: "Qué tipo de dato cargar",
          schema: { type: "string", enum: [...MOCK_TYPE_VALUES], default: MOCK_TYPES.USERS, example: MOCK_TYPES.USERS }
        },
        {
          name: "qty",
          in: "query",
          required: false,
          description: "Cantidad de registros a generar",
          schema: { type: "integer", minimum: 1, maximum: MOCK_LIMITS.MAX_QTY, default: MOCK_LIMITS.DEFAULT_QTY, example: 10 }
        }
      ],
      responses: {
        201: plainResponse("Datos insertados", schemaRef("MockSeedResult")),
        400: errorResponse(
          "`type` o `qty` inválidos",
          errorExample(
            ERROR_CODES.INVALID_MOCK_TYPE,
            `type debe ser uno de: ${MOCK_TYPE_VALUES.join(", ")}`
          ),
          invalidQuantityExample,
          negativeQuantityExample
        ),
        409: errorResponse(
          "Faltan datos previos para generar el tipo pedido",
          errorExample(
            ERROR_CODES.MOCK_PREREQUISITE_MISSING,
            `No hay usuarios con rol "user". Cargá usuarios primero (type=${MOCK_TYPES.USERS}).`,
            { name: "SIN_USUARIOS" }
          ),
          errorExample(
            ERROR_CODES.MOCK_PREREQUISITE_MISSING,
            `No hay pedidos sin entrega. Cargá pedidos primero (type=${MOCK_TYPES.ORDERS}).`,
            { name: "SIN_PEDIDOS" }
          ),
          errorExample(
            ERROR_CODES.MOCK_PREREQUISITE_MISSING,
            `No hay usuarios con rol "courier". Cargá repartidores primero (type=${MOCK_TYPES.COURIERS}).`,
            { name: "SIN_REPARTIDORES" }
          )
        ),
        500: errorResponse(
          "Falló la generación o la carga en MongoDB. El detalle técnico solo queda en el log del servidor. Los registros insertados antes de la falla (si los hubo) quedan guardados.",
          errorExample(
            ERROR_CODES.MOCK_INSERT_FAILED,
            `No se pudieron guardar los datos de prueba (type=${MOCK_TYPES.USERS}) en MongoDB`
          ),
          errorExample(ERROR_CODES.MOCK_GENERATION_FAILED, "No se pudieron generar los datos de prueba")
        )
      }
    }
  }
};
