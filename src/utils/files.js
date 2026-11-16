import fs from "node:fs/promises";
import path from "node:path";
import logger from "../config/logger.js";
import { PROJECT_ROOT } from "../config/multer.js";

// Funciones chicas para trabajar con los archivos ya subidos por Multer.

// Arma los metadatos que se guardan en la base (nunca el archivo).
// `file` es el objeto que Multer deja en req.file.
export const buildFileMetadata = (file, documentType) => ({
  originalName: file.originalname,
  fileName: file.filename,
  // Ruta relativa y con "/": no se expone la estructura de carpetas del servidor
  path: path.relative(PROJECT_ROOT, file.path).split(path.sep).join("/"),
  mimeType: file.mimetype,
  size: file.size,
  documentType,
  uploadedAt: new Date()
});

// Borra del disco un archivo que ya no hace falta (por ejemplo, si la carga falló después de guardarlo).
// Nunca lanza error: si no se puede borrar solo se registra.
export const removeFile = async (file) => {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warning(`No se pudo borrar el archivo ${file.filename}: ${error.message}`);
    }
  }
};
