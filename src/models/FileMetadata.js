import mongoose from "mongoose";
import { DOCUMENT_TYPE_VALUES } from "../constants/index.js";

// Esquema de los METADATOS de un archivo subido (no el archivo: ese queda en el disco, en uploads/).
// Lo usan los usuarios (documents) y las entregas (receipts) como subdocumento.
const fileMetadataSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true }, // nombre que tenía el archivo al subirlo
  fileName: { type: String, required: true }, // nombre generado con el que se guardó
  path: { type: String, required: true }, // ruta relativa a la raíz del proyecto (ej: uploads/documents/xxx.pdf)
  mimeType: { type: String, required: true }, // tipo del archivo (ej: application/pdf)
  size: { type: Number, required: true, min: 0 }, // tamaño en bytes
  documentType: { type: String, enum: DOCUMENT_TYPE_VALUES, required: true },
  uploadedAt: { type: Date, required: true, default: Date.now } // fecha de carga
});

export default fileMetadataSchema;
