import { MOCK_LIMITS, FILE_UPLOAD } from "../constants/index.js";

// Funciones auxiliares para armar la documentación sin repetir estructuras.

export const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });
export const responseRef = (name) => ({ $ref: `#/components/responses/${name}` });

// Un ejemplo de error real: { code, message, details }. `name` identifica el ejemplo (por defecto, el code).
export const errorExample = (code, message, { details = [], name = code } = {}) => ({ name, code, message, details });

// Respuesta de error con la estructura única de la API (ErrorResponse) y uno o más ejemplos
export const errorResponse = (description, ...examples) => ({
  description,
  content: {
    "application/json": {
      schema: schemaRef("ErrorResponse"),
      examples: Object.fromEntries(
        examples.map((example) => [
          example.name,
          {
            summary: example.code,
            value: { status: "error", code: example.code, message: example.message, details: example.details }
          }
        ])
      )
    }
  }
});

// Respuesta exitosa con envoltorio { status: "success", payload }
export const successResponse = (description, payloadSchema) => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [schemaRef("SuccessResponse"), { type: "object", properties: { payload: payloadSchema } }]
      }
    }
  }
});

// Respuesta exitosa sin envoltorio (la usan los endpoints de Mocks)
export const plainResponse = (description, schema) => ({
  description,
  content: { "application/json": { schema } }
});

export const jsonBody = (schemaName, example, description) => ({
  required: true,
  description,
  content: { "application/json": { schema: schemaRef(schemaName), example } }
});

export const idParameter = (entity) => ({
  name: "id",
  in: "path",
  required: true,
  description: `Id del ${entity} (ObjectId de MongoDB: 24 caracteres hexadecimales)`,
  schema: schemaRef("ObjectId")
});

export const qtyParameter = (description) => ({
  name: "qty",
  in: "query",
  required: false,
  description,
  schema: { type: "integer", minimum: 1, maximum: MOCK_LIMITS.MAX_QTY, default: MOCK_LIMITS.DEFAULT_QTY, example: 5 }
});

// Body multipart/form-data con un archivo (campo "file") y, opcionalmente, campos de texto adicionales
export const multipartFileBody = (fileDescription, extraProperties = {}) => ({
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        required: [FILE_UPLOAD.FIELD_NAME],
        properties: {
          [FILE_UPLOAD.FIELD_NAME]: { type: "string", format: "binary", description: fileDescription },
          ...extraProperties
        }
      }
    }
  }
});
