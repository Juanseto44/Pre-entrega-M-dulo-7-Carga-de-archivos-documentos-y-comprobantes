// Valores fijos del dominio de ShipNow.
// Object.freeze evita que alguien los modifique por error mientras corre la app.
// Se usan en lugar de escribir strings sueltos ("admin", "available") por todo el código.

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user", // cliente: el que hace pedidos
  COURIER: "courier" // repartidor: el que realiza las entregas
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: "available",
  OUT_OF_STOCK: "out_of_stock"
});

export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
});

export const ORDER_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

export const DELIVERY_STATUS = Object.freeze({
  PENDING: "pending", // todavía sin repartidor asignado
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered"
});

// Qué estado de entrega le corresponde a cada estado de pedido.
// Un pedido cancelado no aparece acá: no tiene entrega.
export const DELIVERY_STATUS_BY_ORDER_STATUS = Object.freeze({
  [ORDER_STATUS.PENDING]: DELIVERY_STATUS.PENDING,
  [ORDER_STATUS.IN_TRANSIT]: DELIVERY_STATUS.IN_TRANSIT,
  [ORDER_STATUS.DELIVERED]: DELIVERY_STATUS.DELIVERED
});

// Límites del parámetro qty de los endpoints de mocks
export const MOCK_LIMITS = Object.freeze({
  DEFAULT_QTY: 10,
  MAX_QTY: 100 // tope para que la carga de datos sea controlada
});

// Entornos de ejecución (variable NODE_ENV)
export const ENVIRONMENTS = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test"
});

// Qué se puede generar con los endpoints de mocks (POST /api/mocks/seed?type=...)
export const MOCK_TYPES = Object.freeze({
  USERS: "users",
  COURIERS: "couriers",
  ORDERS: "orders",
  DELIVERIES: "deliveries"
});

// ------------------------------------------------------------------
// Carga de archivos (Multer)
// ------------------------------------------------------------------

// Tipos de documento que se pueden asociar a un usuario (campo documentType)
export const USER_DOCUMENT_TYPES = Object.freeze({
  DNI: "dni",
  LICENSE: "license", // licencia de conducir (repartidores)
  ADDRESS_PROOF: "address_proof", // comprobante de domicilio
  OTHER: "other"
});

// Tipo de documento que se guarda en los comprobantes de entrega (no lo elige el cliente)
export const RECEIPT_DOCUMENT_TYPE = "delivery_receipt";

// Reglas de los archivos que acepta la API
export const FILE_UPLOAD = Object.freeze({
  FIELD_NAME: "file", // nombre del campo multipart donde viaja el archivo
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  // Tipo MIME permitido -> extensión con la que se guarda (no se confía en la extensión original)
  ALLOWED_MIME_TYPES: Object.freeze({
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf"
  })
});

// Subcarpetas dentro de uploads/ (una por tipo de archivo)
export const UPLOAD_FOLDERS = Object.freeze({
  DOCUMENTS: "documents", // documentos de usuario (DNI, licencia...)
  RECEIPTS: "receipts" // comprobantes de entrega
});

// Listas de valores permitidos (las usan los modelos para el enum y los services para validar)
export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));
export const PRODUCT_STATUS_VALUES = Object.freeze(Object.values(PRODUCT_STATUS));
export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));
export const ORDER_PRIORITY_VALUES = Object.freeze(Object.values(ORDER_PRIORITY));
export const DELIVERY_STATUS_VALUES = Object.freeze(Object.values(DELIVERY_STATUS));
export const MOCK_TYPE_VALUES = Object.freeze(Object.values(MOCK_TYPES));
export const ENVIRONMENT_VALUES = Object.freeze(Object.values(ENVIRONMENTS));
export const USER_DOCUMENT_TYPE_VALUES = Object.freeze(Object.values(USER_DOCUMENT_TYPES));
export const DOCUMENT_TYPE_VALUES = Object.freeze([...USER_DOCUMENT_TYPE_VALUES, RECEIPT_DOCUMENT_TYPE]);
export const ALLOWED_MIME_TYPE_VALUES = Object.freeze(Object.keys(FILE_UPLOAD.ALLOWED_MIME_TYPES));
