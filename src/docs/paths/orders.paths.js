import { ORDER_STATUS_VALUES } from "../../constants/index.js";
import { ERROR_CODES } from "../../errors/index.js";
import { errorExample, errorResponse, successResponse, jsonBody, idParameter, schemaRef, responseRef } from "../helpers.js";
import { invalidIdExample, invalidJsonExample, invalidStatusExample } from "../examples.js";

const TAG = "Orders";

const validationExample = errorExample(ERROR_CODES.VALIDATION_ERROR, "Los datos del pedido no son válidos", {
  details: [
    { field: "items", message: "El campo items debe ser una lista con al menos un item" },
    { field: "originAddress", message: "El campo originAddress es obligatorio" }
  ]
});

export const ordersPaths = {
  "/api/orders": {
    get: {
      tags: [TAG],
      summary: "Listar pedidos",
      description:
        "Devuelve los pedidos, los más nuevos primero. Se pueden filtrar por estado con `?status=`. Los pedidos se crean con `POST /api/orders` o se generan con `POST /api/mocks/seed?type=orders`.",
      operationId: "getOrders",
      parameters: [
        {
          name: "status",
          in: "query",
          required: false,
          description: "Devuelve solo los pedidos con este estado",
          schema: { type: "string", enum: [...ORDER_STATUS_VALUES], example: "pending" }
        }
      ],
      responses: {
        200: successResponse("Lista de pedidos", { type: "array", items: schemaRef("Order") }),
        400: errorResponse("El estado indicado no existe", invalidStatusExample("shipped", ORDER_STATUS_VALUES)),
        500: responseRef("InternalError")
      }
    },
    post: {
      tags: [TAG],
      summary: "Crear un pedido",
      description:
        "Crea un pedido para un usuario existente. `user`, `items` (al menos uno), `originAddress` y `destinationAddress` son obligatorios; `priority` es opcional (por defecto `medium`). El pedido siempre se crea con estado `pending`.",
      operationId: "createOrder",
      requestBody: jsonBody("OrderInput", {
        user: "665f1c2e8b3a4d0012a4c9e1",
        items: [{ description: "Caja de libros", quantity: 2, weight: 3.5 }],
        originAddress: "Av. Corrientes 1234, Buenos Aires",
        destinationAddress: "San Martín 567, Rosario",
        priority: "medium"
      }),
      responses: {
        201: successResponse("Pedido creado", schemaRef("Order")),
        400: errorResponse(
          "Datos inválidos (`details` indica cada campo) o body que no es un JSON válido",
          validationExample,
          invalidJsonExample
        ),
        404: errorResponse(
          "El usuario indicado en `user` no existe",
          errorExample(ERROR_CODES.USER_NOT_FOUND, "Usuario no encontrado")
        ),
        500: responseRef("InternalError")
      }
    }
  },

  "/api/orders/{id}": {
    get: {
      tags: [TAG],
      summary: "Obtener un pedido por id",
      operationId: "getOrderById",
      parameters: [idParameter("pedido")],
      responses: {
        200: successResponse("El pedido", schemaRef("Order")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("pedido")),
        404: responseRef("OrderNotFound"),
        500: responseRef("InternalError")
      }
    }
  }
};
