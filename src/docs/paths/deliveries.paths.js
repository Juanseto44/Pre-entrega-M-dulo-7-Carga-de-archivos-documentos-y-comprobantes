import { DELIVERY_STATUS_VALUES, FILE_UPLOAD, ALLOWED_MIME_TYPE_VALUES } from "../../constants/index.js";
import { errorResponse, successResponse, multipartFileBody, idParameter, schemaRef, responseRef } from "../helpers.js";
import {
  invalidIdExample,
  invalidStatusExample,
  fileRequiredExample,
  invalidFileFieldExample,
  fileTooLargeExample,
  invalidFileTypeExample,
  fileSaveFailedExample
} from "../examples.js";

const TAG = "Deliveries";

export const deliveriesPaths = {
  "/api/deliveries": {
    get: {
      tags: [TAG],
      summary: "Listar entregas",
      description:
        "Devuelve las entregas, las más nuevas primero. Se pueden filtrar por estado con `?status=`. Las entregas se pueden generar con `POST /api/mocks/seed?type=deliveries`.",
      operationId: "getDeliveries",
      parameters: [
        {
          name: "status",
          in: "query",
          required: false,
          description: "Devuelve solo las entregas con este estado",
          schema: { type: "string", enum: [...DELIVERY_STATUS_VALUES], example: "in_transit" }
        }
      ],
      responses: {
        200: successResponse("Lista de entregas", { type: "array", items: schemaRef("Delivery") }),
        400: errorResponse("El estado indicado no existe", invalidStatusExample("lost", DELIVERY_STATUS_VALUES)),
        500: responseRef("InternalError")
      }
    }
  },

  "/api/deliveries/{id}": {
    get: {
      tags: [TAG],
      summary: "Obtener una entrega por id",
      operationId: "getDeliveryById",
      parameters: [idParameter("entrega")],
      responses: {
        200: successResponse("La entrega", schemaRef("Delivery")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("entrega")),
        404: responseRef("DeliveryNotFound"),
        500: responseRef("InternalError")
      }
    }
  },

  "/api/deliveries/{id}/receipts": {
    post: {
      tags: [TAG],
      summary: "Subir un comprobante de una entrega",
      description: [
        "Sube un comprobante (foto de la entrega, remito firmado, etc.) y lo asocia a la entrega. El archivo se guarda en el servidor (`uploads/receipts/`) y en la base solo se registran sus **metadatos**.",
        "",
        `- **Formato:** \`multipart/form-data\`. El archivo va en el campo **\`${FILE_UPLOAD.FIELD_NAME}\`** (obligatorio). No hay otros campos.`,
        `- **Tipos de archivo permitidos:** ${ALLOWED_MIME_TYPE_VALUES.map((type) => `\`${type}\``).join(", ")}.`,
        `- **Tamaño máximo:** ${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)} MB.`,
        "",
        "Devuelve la entrega actualizada, con el nuevo comprobante en `receipts` (su `documentType` es `delivery_receipt`)."
      ].join("\n"),
      operationId: "addDeliveryReceipt",
      parameters: [idParameter("entrega")],
      requestBody: multipartFileBody("Comprobante a subir (PDF, JPG o PNG)"),
      responses: {
        201: successResponse("Comprobante cargado. Devuelve la entrega actualizada", schemaRef("Delivery")),
        400: errorResponse(
          "Falta el archivo, el archivo está en otro campo o el id es inválido",
          fileRequiredExample,
          invalidFileFieldExample,
          invalidIdExample("entrega")
        ),
        404: responseRef("DeliveryNotFound"),
        413: errorResponse(`El archivo supera los ${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)} MB`, fileTooLargeExample),
        415: errorResponse("El tipo de archivo no está permitido", invalidFileTypeExample),
        500: errorResponse("No se pudo guardar el archivo o sus metadatos", fileSaveFailedExample)
      }
    }
  }
};
