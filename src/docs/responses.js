import { ERROR_CODES } from "../errors/index.js";
import { errorExample, errorResponse } from "./helpers.js";

// Respuestas de error reutilizables (components.responses).
// Los mensajes son los que la API devuelve de verdad.

export const responses = {
  InternalError: errorResponse(
    "Error interno inesperado. El detalle técnico no se envía al cliente: solo queda en el log del servidor.",
    errorExample(ERROR_CODES.INTERNAL_ERROR, "Error interno del servidor")
  ),
  UserNotFound: errorResponse(
    "El usuario no existe",
    errorExample(ERROR_CODES.USER_NOT_FOUND, "Usuario no encontrado")
  ),
  ProductNotFound: errorResponse(
    "El producto no existe",
    errorExample(ERROR_CODES.PRODUCT_NOT_FOUND, "Producto no encontrado")
  ),
  OrderNotFound: errorResponse(
    "El pedido no existe",
    errorExample(ERROR_CODES.ORDER_NOT_FOUND, "Pedido no encontrado")
  ),
  DeliveryNotFound: errorResponse(
    "La entrega no existe",
    errorExample(ERROR_CODES.DELIVERY_NOT_FOUND, "Entrega no encontrada")
  ),
  EmailAlreadyRegistered: errorResponse(
    "Ya existe otro usuario con ese email",
    errorExample(ERROR_CODES.EMAIL_ALREADY_REGISTERED, "El email ya está registrado")
  ),
  MockGenerationFailed: errorResponse(
    "Falló la generación de los datos simulados",
    errorExample(ERROR_CODES.MOCK_GENERATION_FAILED, "No se pudieron generar los datos de prueba")
  )
};
