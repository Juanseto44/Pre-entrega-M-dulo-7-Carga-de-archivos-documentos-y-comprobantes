import {
  USER_ROLE_VALUES,
  PRODUCT_STATUS_VALUES,
  ORDER_STATUS_VALUES,
  ORDER_PRIORITY_VALUES,
  DELIVERY_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES
} from "../constants/index.js";
import { ERROR_CODES } from "../errors/index.js";
import { schemaRef } from "./helpers.js";

// Schemas reutilizables (components.schemas).
// Los valores permitidos (roles, estados, prioridades, códigos de error) se toman de las constantes
// del proyecto, así la documentación no se desactualiza si esos valores cambian.

const EXAMPLE_ID = "665f1c2e8b3a4d0012a4c9e1";
const EXAMPLE_DATE = "2026-11-15T13:05:00.000Z";

const timestamps = {
  createdAt: { type: "string", format: "date-time", example: EXAMPLE_DATE },
  updatedAt: { type: "string", format: "date-time", example: EXAMPLE_DATE }
};

export const schemas = {
  // ---------------- Comunes ----------------
  ObjectId: {
    type: "string",
    pattern: "^[0-9a-fA-F]{24}$",
    description: "Id de MongoDB (24 caracteres hexadecimales)",
    example: EXAMPLE_ID
  },

  SuccessResponse: {
    type: "object",
    description: "Envoltorio de toda respuesta exitosa (salvo los endpoints de Mocks). `payload` contiene los datos.",
    required: ["status", "payload"],
    properties: {
      status: { type: "string", enum: ["success"] },
      payload: { description: "Datos devueltos (varía según el endpoint)" }
    }
  },

  ErrorDetail: {
    type: "object",
    description: "Detalle de un campo inválido (solo en errores de validación)",
    required: ["field", "message"],
    properties: {
      field: { type: "string", example: "email" },
      message: { type: "string", example: "El email no es válido" }
    }
  },

  ErrorResponse: {
    type: "object",
    description: "Estructura única de TODOS los errores de la API",
    required: ["status", "code", "message", "details"],
    properties: {
      status: { type: "string", enum: ["error"] },
      code: {
        type: "string",
        description: "Código del error, estable y pensado para que lo lea un programa",
        enum: Object.values(ERROR_CODES),
        example: ERROR_CODES.USER_NOT_FOUND
      },
      message: { type: "string", description: "Explicación para una persona", example: "Usuario no encontrado" },
      details: {
        type: "array",
        description: "Más detalle del error. Vacía si no hay.",
        items: schemaRef("ErrorDetail")
      }
    }
  },

  // ---------------- Archivos ----------------
  FileMetadata: {
    type: "object",
    description: "Metadatos de un archivo subido. El archivo en sí se guarda en el servidor (carpeta `uploads/`), no en la base.",
    required: ["_id", "originalName", "fileName", "path", "mimeType", "size", "documentType", "uploadedAt"],
    properties: {
      _id: schemaRef("ObjectId"),
      originalName: { type: "string", description: "Nombre que tenía el archivo al subirlo", example: "dni-frente.pdf" },
      fileName: { type: "string", description: "Nombre generado con el que se guardó", example: "1763299500000-4f6e0c1a-8d5b-4c0e-9a57-2b8f1d3c7e11.pdf" },
      path: { type: "string", description: "Ruta relativa dentro del servidor", example: "uploads/documents/1763299500000-4f6e0c1a-8d5b-4c0e-9a57-2b8f1d3c7e11.pdf" },
      mimeType: { type: "string", example: "application/pdf" },
      size: { type: "integer", description: "Tamaño en bytes", example: 20480 },
      documentType: { type: "string", enum: [...DOCUMENT_TYPE_VALUES], example: "dni" },
      uploadedAt: { type: "string", format: "date-time", example: EXAMPLE_DATE }
    }
  },

  // ---------------- Usuarios ----------------
  User: {
    type: "object",
    required: ["_id", "first_name", "last_name", "email", "role", "createdAt", "updatedAt"],
    properties: {
      _id: schemaRef("ObjectId"),
      first_name: { type: "string", example: "Ana" },
      last_name: { type: "string", example: "Pérez" },
      email: { type: "string", format: "email", example: "ana.perez@test.com" },
      role: {
        type: "string",
        enum: [...USER_ROLE_VALUES],
        description: "`user` = cliente, `courier` = repartidor, `admin` = administrador",
        example: "user"
      },
      documents: {
        type: "array",
        description: "Metadatos de los documentos subidos con `POST /api/users/{id}/documents`",
        items: schemaRef("FileMetadata")
      },
      ...timestamps
    }
  },

  UserInput: {
    type: "object",
    description: "Datos para crear un usuario",
    required: ["first_name", "last_name", "email"],
    properties: {
      first_name: { type: "string", example: "Ana" },
      last_name: { type: "string", example: "Pérez" },
      email: { type: "string", format: "email", description: "Debe ser único (se guarda en minúsculas)", example: "ana.perez@test.com" },
      role: { type: "string", enum: [...USER_ROLE_VALUES], default: "user", example: "user" }
    }
  },

  UserUpdateInput: {
    type: "object",
    description: "Campos a modificar. Se debe enviar al menos uno.",
    minProperties: 1,
    properties: {
      first_name: { type: "string", example: "Ana" },
      last_name: { type: "string", example: "Gómez" },
      email: { type: "string", format: "email", example: "ana.gomez@test.com" },
      role: { type: "string", enum: [...USER_ROLE_VALUES], example: "courier" }
    }
  },

  // ---------------- Productos ----------------
  Product: {
    type: "object",
    required: ["_id", "name", "description", "price", "stock", "status", "createdAt", "updatedAt"],
    properties: {
      _id: schemaRef("ObjectId"),
      name: { type: "string", example: "Caja chica" },
      description: { type: "string", example: "Caja de cartón 20x20" },
      price: { type: "number", minimum: 0, example: 1500 },
      stock: { type: "integer", minimum: 0, example: 10 },
      status: {
        type: "string",
        enum: [...PRODUCT_STATUS_VALUES],
        description: "Se calcula según el stock: `available` si hay stock, `out_of_stock` si es 0",
        example: "available"
      },
      ...timestamps
    }
  },

  ProductInput: {
    type: "object",
    description: "Datos para crear un producto. El estado NO se envía: se calcula según el stock.",
    required: ["name", "price", "stock"],
    properties: {
      name: { type: "string", example: "Caja chica" },
      description: { type: "string", example: "Caja de cartón 20x20" },
      price: { type: "number", minimum: 0, example: 1500 },
      stock: { type: "integer", minimum: 0, example: 10 }
    }
  },

  ProductUpdateInput: {
    type: "object",
    description: "Campos a modificar. Se debe enviar al menos uno.",
    minProperties: 1,
    properties: {
      name: { type: "string", example: "Caja mediana" },
      description: { type: "string", example: "Caja de cartón 30x30" },
      price: { type: "number", minimum: 0, example: 2200 },
      stock: { type: "integer", minimum: 0, example: 0 }
    }
  },

  // ---------------- Pedidos ----------------
  OrderItem: {
    type: "object",
    description: "Un item (paquete o producto) dentro de un pedido",
    required: ["description", "quantity", "weight"],
    properties: {
      description: { type: "string", example: "Caja de libros" },
      quantity: { type: "integer", minimum: 1, example: 2 },
      weight: { type: "number", minimum: 0, description: "Peso de una unidad, en kilos", example: 3.5 }
    }
  },

  Order: {
    type: "object",
    required: ["_id", "user", "items", "originAddress", "destinationAddress", "status", "priority", "createdAt", "updatedAt"],
    properties: {
      _id: schemaRef("ObjectId"),
      user: { ...schemaRef("ObjectId"), description: "Id del usuario (cliente) que hizo el pedido" },
      items: { type: "array", minItems: 1, items: schemaRef("OrderItem") },
      originAddress: { type: "string", example: "Av. Corrientes 1234, Buenos Aires" },
      destinationAddress: { type: "string", example: "San Martín 567, Rosario" },
      status: { type: "string", enum: [...ORDER_STATUS_VALUES], example: "pending" },
      priority: { type: "string", enum: [...ORDER_PRIORITY_VALUES], example: "medium" },
      ...timestamps
    }
  },

  OrderInput: {
    type: "object",
    description: "Datos para crear un pedido. El pedido siempre se crea con estado `pending`.",
    required: ["user", "items", "originAddress", "destinationAddress"],
    properties: {
      user: { ...schemaRef("ObjectId"), description: "Id del usuario (cliente) que hace el pedido. Debe existir." },
      items: { type: "array", minItems: 1, items: schemaRef("OrderItem") },
      originAddress: { type: "string", example: "Av. Corrientes 1234, Buenos Aires" },
      destinationAddress: { type: "string", example: "San Martín 567, Rosario" },
      priority: { type: "string", enum: [...ORDER_PRIORITY_VALUES], default: "medium", example: "medium" }
    }
  },

  // ---------------- Entregas ----------------
  Delivery: {
    type: "object",
    required: ["_id", "order", "courier", "status", "scheduledDate", "createdAt", "updatedAt"],
    properties: {
      _id: schemaRef("ObjectId"),
      order: { ...schemaRef("ObjectId"), description: "Id del pedido al que pertenece la entrega" },
      courier: {
        type: "string",
        nullable: true,
        pattern: "^[0-9a-fA-F]{24}$",
        description: "Id del repartidor (usuario con rol `courier`). Es `null` mientras la entrega está pendiente.",
        example: EXAMPLE_ID
      },
      status: { type: "string", enum: [...DELIVERY_STATUS_VALUES], example: "in_transit" },
      scheduledDate: { type: "string", format: "date-time", example: EXAMPLE_DATE },
      receipts: {
        type: "array",
        description: "Metadatos de los comprobantes subidos con `POST /api/deliveries/{id}/receipts`",
        items: schemaRef("FileMetadata")
      },
      ...timestamps
    }
  },

  // ---------------- Mocks ----------------
  MockUser: {
    type: "object",
    description: "Usuario simulado (no se guardó: no tiene _id)",
    required: ["first_name", "last_name", "email", "role"],
    properties: {
      first_name: { type: "string", example: "Ana" },
      last_name: { type: "string", example: "Pérez" },
      email: { type: "string", format: "email", example: "ana.perez1234@test.com" },
      role: { type: "string", enum: [...USER_ROLE_VALUES], example: "user" }
    }
  },

  MockOrder: {
    type: "object",
    description: "Pedido simulado (no se guardó). `user` es un id inventado.",
    required: ["user", "items", "originAddress", "destinationAddress", "status", "priority"],
    properties: {
      user: schemaRef("ObjectId"),
      items: { type: "array", minItems: 1, items: schemaRef("OrderItem") },
      originAddress: { type: "string", example: "Calle 45, Córdoba" },
      destinationAddress: { type: "string", example: "Calle 12, Mendoza" },
      status: { type: "string", enum: [...ORDER_STATUS_VALUES], example: "pending" },
      priority: { type: "string", enum: [...ORDER_PRIORITY_VALUES], example: "high" }
    }
  },

  MockDelivery: {
    type: "object",
    description: "Entrega simulada (no se guardó). `order` y `courier` son ids inventados; `courier` es `null` si la entrega está pendiente.",
    required: ["order", "courier", "status", "scheduledDate"],
    properties: {
      order: schemaRef("ObjectId"),
      courier: { type: "string", nullable: true, pattern: "^[0-9a-fA-F]{24}$", example: EXAMPLE_ID },
      status: { type: "string", enum: [...DELIVERY_STATUS_VALUES], example: "in_transit" },
      scheduledDate: { type: "string", format: "date-time", example: EXAMPLE_DATE }
    }
  },

  MockSeedResult: {
    type: "object",
    description: "Resultado de la carga de datos de prueba",
    required: ["insertados", "coleccion"],
    properties: {
      insertados: { type: "integer", description: "Cantidad de registros guardados", example: 10 },
      coleccion: { type: "string", description: "Colección de MongoDB donde se guardaron", example: "users" }
    }
  },

  // ---------------- Logger ----------------
  LoggerTestResult: {
    type: "object",
    required: ["environment", "activeLevel", "levels"],
    properties: {
      environment: { type: "string", description: "Valor de NODE_ENV", example: "development" },
      activeLevel: { type: "string", description: "Nivel mínimo que registra el entorno actual", example: "debug" },
      levels: {
        type: "object",
        description: "Para cada nivel: `true` si se registró, `false` si el entorno actual lo descarta",
        required: ["debug", "http", "info", "warning", "error", "fatal"],
        properties: {
          debug: { type: "boolean" },
          http: { type: "boolean" },
          info: { type: "boolean" },
          warning: { type: "boolean" },
          error: { type: "boolean" },
          fatal: { type: "boolean" }
        }
      }
    }
  }
};
