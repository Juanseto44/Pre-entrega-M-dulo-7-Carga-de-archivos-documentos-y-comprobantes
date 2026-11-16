import { ERROR_CODES } from "../../errors/index.js";
import {
  errorExample,
  errorResponse,
  successResponse,
  jsonBody,
  multipartFileBody,
  idParameter,
  schemaRef,
  responseRef
} from "../helpers.js";
import {
  invalidIdExample,
  invalidJsonExample,
  noFieldsToUpdateExample,
  fileRequiredExample,
  invalidFileFieldExample,
  fileTooLargeExample,
  invalidFileTypeExample,
  fileSaveFailedExample
} from "../examples.js";
import { USER_DOCUMENT_TYPE_VALUES, USER_DOCUMENT_TYPES, FILE_UPLOAD, ALLOWED_MIME_TYPE_VALUES } from "../../constants/index.js";

const TAG = "Users";

const validationExample = errorExample(ERROR_CODES.VALIDATION_ERROR, "Los datos del usuario no son válidos", {
  details: [
    { field: "email", message: "El email no es válido" },
    { field: "role", message: "El rol debe ser uno de: admin, user, courier" }
  ]
});

export const usersPaths = {
  "/api/users": {
    get: {
      tags: [TAG],
      summary: "Listar usuarios",
      description: "Devuelve todos los usuarios, los más nuevos primero.",
      operationId: "getUsers",
      responses: {
        200: successResponse("Lista de usuarios", { type: "array", items: schemaRef("User") }),
        500: responseRef("InternalError")
      }
    },
    post: {
      tags: [TAG],
      summary: "Crear un usuario",
      description:
        "Crea un usuario. `first_name`, `last_name` y `email` son obligatorios; `role` es opcional (por defecto `user`). El email debe ser único.",
      operationId: "createUser",
      requestBody: jsonBody("UserInput", {
        first_name: "Ana",
        last_name: "Pérez",
        email: "ana.perez@test.com",
        role: "user"
      }),
      responses: {
        201: successResponse("Usuario creado", schemaRef("User")),
        400: errorResponse(
          "Datos inválidos (`details` indica cada campo) o body que no es un JSON válido",
          validationExample,
          invalidJsonExample
        ),
        409: responseRef("EmailAlreadyRegistered"),
        500: responseRef("InternalError")
      }
    }
  },

  "/api/users/{id}/documents": {
    post: {
      tags: [TAG],
      summary: "Subir un documento de un usuario",
      description: [
        "Sube un documento (DNI, licencia, etc.) y lo asocia al usuario. El archivo se guarda en el servidor (`uploads/documents/`) y en la base solo se registran sus **metadatos**.",
        "",
        `- **Formato:** \`multipart/form-data\`. El archivo va en el campo **\`${FILE_UPLOAD.FIELD_NAME}\`** (obligatorio).`,
        `- **Tipos de archivo permitidos:** ${ALLOWED_MIME_TYPE_VALUES.map((type) => `\`${type}\``).join(", ")}.`,
        `- **Tamaño máximo:** ${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)} MB.`,
        `- **\`documentType\`** (opcional): ${USER_DOCUMENT_TYPE_VALUES.map((type) => `\`${type}\``).join(", ")}. Si no se envía, se usa \`${USER_DOCUMENT_TYPES.OTHER}\`.`,
        "",
        "Devuelve el usuario actualizado, con el nuevo documento en `documents`."
      ].join("\n"),
      operationId: "addUserDocument",
      parameters: [idParameter("usuario")],
      requestBody: multipartFileBody("Archivo a subir (PDF, JPG o PNG)", {
        documentType: {
          type: "string",
          enum: [...USER_DOCUMENT_TYPE_VALUES],
          default: USER_DOCUMENT_TYPES.OTHER,
          description: "Tipo de documento (opcional)",
          example: USER_DOCUMENT_TYPES.DNI
        }
      }),
      responses: {
        201: successResponse("Documento cargado. Devuelve el usuario actualizado", schemaRef("User")),
        400: errorResponse(
          "Falta el archivo, el archivo está en otro campo, `documentType` inválido o id inválido",
          fileRequiredExample,
          invalidFileFieldExample,
          errorExample(
            ERROR_CODES.INVALID_DOCUMENT_TYPE,
            `El tipo de documento "pasaporte" no es válido. Valores permitidos: ${USER_DOCUMENT_TYPE_VALUES.join(", ")}`
          ),
          invalidIdExample("usuario")
        ),
        404: responseRef("UserNotFound"),
        413: errorResponse(`El archivo supera los ${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)} MB`, fileTooLargeExample),
        415: errorResponse("El tipo de archivo no está permitido", invalidFileTypeExample),
        500: errorResponse("No se pudo guardar el archivo o sus metadatos", fileSaveFailedExample)
      }
    }
  },

  "/api/users/{id}": {
    get: {
      tags: [TAG],
      summary: "Obtener un usuario por id",
      operationId: "getUserById",
      parameters: [idParameter("usuario")],
      responses: {
        200: successResponse("El usuario", schemaRef("User")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("usuario")),
        404: responseRef("UserNotFound"),
        500: responseRef("InternalError")
      }
    },
    put: {
      tags: [TAG],
      summary: "Editar un usuario",
      description: "Modifica solo los campos enviados (al menos uno). Si se cambia el email, debe seguir siendo único.",
      operationId: "updateUser",
      parameters: [idParameter("usuario")],
      requestBody: jsonBody("UserUpdateInput", { first_name: "Ana", last_name: "Gómez", role: "courier" }),
      responses: {
        200: successResponse("El usuario ya actualizado", schemaRef("User")),
        400: errorResponse(
          "Id inválido, datos inválidos, body sin campos o body que no es un JSON válido",
          invalidIdExample("usuario"),
          validationExample,
          noFieldsToUpdateExample(["first_name", "last_name", "email", "role"]),
          invalidJsonExample
        ),
        404: responseRef("UserNotFound"),
        409: responseRef("EmailAlreadyRegistered"),
        500: responseRef("InternalError")
      }
    },
    delete: {
      tags: [TAG],
      summary: "Eliminar un usuario",
      description: "Elimina el usuario y devuelve los datos del usuario eliminado.",
      operationId: "deleteUser",
      parameters: [idParameter("usuario")],
      responses: {
        200: successResponse("El usuario eliminado", schemaRef("User")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("usuario")),
        404: responseRef("UserNotFound"),
        500: responseRef("InternalError")
      }
    }
  }
};
