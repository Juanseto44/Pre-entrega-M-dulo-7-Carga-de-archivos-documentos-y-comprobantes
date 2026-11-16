import { ERROR_CODES } from "../errors/index.js";
import { MOCK_LIMITS, FILE_UPLOAD, ALLOWED_MIME_TYPE_VALUES } from "../constants/index.js";
import { errorExample } from "./helpers.js";

// Ejemplos de error compartidos por varios endpoints (mensajes reales de la API).

export const invalidIdExample = (entity) =>
  errorExample(ERROR_CODES.INVALID_ID, `El id del ${entity} no es válido`);

export const invalidJsonExample = errorExample(ERROR_CODES.INVALID_JSON, "El body no es un JSON válido");

export const noFieldsToUpdateExample = (allowedFields) =>
  errorExample(
    ERROR_CODES.VALIDATION_ERROR,
    `No se enviaron campos para actualizar. Campos permitidos: ${allowedFields.join(", ")}`,
    { name: "NO_FIELDS_TO_UPDATE" }
  );

export const invalidStatusExample = (status, validStatuses) =>
  errorExample(
    ERROR_CODES.INVALID_STATUS,
    `El estado "${status}" no es válido. Valores permitidos: ${validStatuses.join(", ")}`
  );

export const invalidQuantityExample = errorExample(
  ERROR_CODES.INVALID_QUANTITY,
  `qty debe ser un número entero entre 1 y ${MOCK_LIMITS.MAX_QTY}`
);

export const negativeQuantityExample = errorExample(
  ERROR_CODES.NEGATIVE_QUANTITY,
  "La cantidad (qty) no puede ser negativa"
);

// Errores de carga de archivos (mensajes reales de la API)
export const fileRequiredExample = errorExample(
  ERROR_CODES.FILE_REQUIRED,
  `Falta el archivo. Enviá un archivo en el campo "${FILE_UPLOAD.FIELD_NAME}" (multipart/form-data)`
);

export const invalidFileFieldExample = errorExample(
  ERROR_CODES.INVALID_FILE_FIELD,
  `El archivo debe enviarse en el campo "${FILE_UPLOAD.FIELD_NAME}" (campo recibido: "document")`
);

export const fileTooLargeExample = errorExample(
  ERROR_CODES.FILE_TOO_LARGE,
  `El archivo supera el tamaño máximo permitido (${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)} MB)`
);

export const invalidFileTypeExample = errorExample(
  ERROR_CODES.INVALID_FILE_TYPE,
  `El tipo de archivo "text/plain" no está permitido. Tipos permitidos: ${ALLOWED_MIME_TYPE_VALUES.join(", ")}`
);

export const fileSaveFailedExample = errorExample(ERROR_CODES.FILE_SAVE_FAILED, "No se pudo guardar el archivo");
