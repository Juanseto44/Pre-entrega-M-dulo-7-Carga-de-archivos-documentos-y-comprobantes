// Diccionario de errores de ShipNow.
// Cada error tiene un código propio (que ve el cliente), un status HTTP y un mensaje por defecto.
// Es el único lugar donde se decide "qué status HTTP corresponde a cada error".

// Códigos: se usan en lugar de escribir strings sueltos
export const ERROR_CODES = Object.freeze({
  // 400 - el cliente envió algo inválido
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_ID: "INVALID_ID",
  INVALID_JSON: "INVALID_JSON",
  INVALID_STATUS: "INVALID_STATUS",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  NEGATIVE_QUANTITY: "NEGATIVE_QUANTITY",
  INVALID_MOCK_TYPE: "INVALID_MOCK_TYPE",
  FILE_REQUIRED: "FILE_REQUIRED",
  INVALID_FILE_FIELD: "INVALID_FILE_FIELD",
  INVALID_DOCUMENT_TYPE: "INVALID_DOCUMENT_TYPE",
  // 413 / 415 - problemas con el archivo enviado
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  // 404 - no existe lo que se busca
  USER_NOT_FOUND: "USER_NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  DELIVERY_NOT_FOUND: "DELIVERY_NOT_FOUND",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  // 409 - conflicto con el estado actual de los datos
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  MOCK_PREREQUISITE_MISSING: "MOCK_PREREQUISITE_MISSING",
  // 500 - fallas del servidor
  MOCK_GENERATION_FAILED: "MOCK_GENERATION_FAILED",
  MOCK_INSERT_FAILED: "MOCK_INSERT_FAILED",
  FILE_SAVE_FAILED: "FILE_SAVE_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
});

export const ERROR_DICTIONARY = Object.freeze({
  [ERROR_CODES.VALIDATION_ERROR]: { statusCode: 400, message: "Los datos enviados no son válidos" },
  [ERROR_CODES.INVALID_ID]: { statusCode: 400, message: "El id no es válido" },
  [ERROR_CODES.INVALID_JSON]: { statusCode: 400, message: "El body no es un JSON válido" },
  [ERROR_CODES.INVALID_STATUS]: { statusCode: 400, message: "El estado no es válido" },
  [ERROR_CODES.INVALID_QUANTITY]: { statusCode: 400, message: "La cantidad (qty) no es válida" },
  [ERROR_CODES.NEGATIVE_QUANTITY]: { statusCode: 400, message: "La cantidad (qty) no puede ser negativa" },
  [ERROR_CODES.INVALID_MOCK_TYPE]: { statusCode: 400, message: "El tipo de dato a generar (type) no es válido" },
  [ERROR_CODES.FILE_REQUIRED]: { statusCode: 400, message: "Falta el archivo" },
  [ERROR_CODES.INVALID_FILE_FIELD]: { statusCode: 400, message: "El archivo se envió en un campo incorrecto" },
  [ERROR_CODES.INVALID_DOCUMENT_TYPE]: { statusCode: 400, message: "El tipo de documento no es válido" },
  [ERROR_CODES.FILE_TOO_LARGE]: { statusCode: 413, message: "El archivo supera el tamaño máximo permitido" },
  [ERROR_CODES.INVALID_FILE_TYPE]: { statusCode: 415, message: "El tipo de archivo no está permitido" },

  [ERROR_CODES.USER_NOT_FOUND]: { statusCode: 404, message: "Usuario no encontrado" },
  [ERROR_CODES.PRODUCT_NOT_FOUND]: { statusCode: 404, message: "Producto no encontrado" },
  [ERROR_CODES.ORDER_NOT_FOUND]: { statusCode: 404, message: "Pedido no encontrado" },
  [ERROR_CODES.DELIVERY_NOT_FOUND]: { statusCode: 404, message: "Entrega no encontrada" },
  [ERROR_CODES.ROUTE_NOT_FOUND]: { statusCode: 404, message: "Ruta no encontrada" },

  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]: { statusCode: 409, message: "El email ya está registrado" },
  [ERROR_CODES.MOCK_PREREQUISITE_MISSING]: {
    statusCode: 409,
    message: "Faltan datos previos para generar este tipo de dato de prueba"
  },

  [ERROR_CODES.MOCK_GENERATION_FAILED]: { statusCode: 500, message: "No se pudieron generar los datos de prueba" },
  [ERROR_CODES.MOCK_INSERT_FAILED]: { statusCode: 500, message: "No se pudieron guardar los datos de prueba en MongoDB" },
  [ERROR_CODES.FILE_SAVE_FAILED]: { statusCode: 500, message: "No se pudo guardar el archivo" },
  [ERROR_CODES.INTERNAL_ERROR]: { statusCode: 500, message: "Error interno del servidor" }
});
