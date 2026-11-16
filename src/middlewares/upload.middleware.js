import logger from "../config/logger.js";
import { createUploader, multer } from "../config/multer.js";
import { FILE_UPLOAD } from "../constants/index.js";
import {
  AppError,
  InvalidDataError,
  InvalidFileFieldError,
  FileTooLargeError,
  FileSaveError
} from "../errors/index.js";

// Middleware que recibe UN archivo en el campo "file" y lo guarda en la subcarpeta indicada.
// Corre ANTES del controller. Si algo falla, convierte el error de Multer en un error del
// proyecto y lo deriva con next(error): lo responde el middleware global de errores.

// Traduce los errores de Multer a los errores del dominio (con el formato de respuesta del proyecto)
const toAppError = (error) => {
  // Ya es un error del proyecto (por ejemplo, tipo de archivo no permitido desde el fileFilter)
  if (error instanceof AppError) return error;

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      logger.warning(`Archivo rechazado: supera el máximo de ${FILE_UPLOAD.MAX_SIZE_BYTES} bytes`);
      return new FileTooLargeError(FILE_UPLOAD.MAX_SIZE_BYTES);
    }
    // Archivo en otro campo, o más de un archivo
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return new InvalidFileFieldError(FILE_UPLOAD.FIELD_NAME, error.field);
    }
    return new InvalidDataError(`La carga del archivo no es válida: ${error.message}`);
  }

  // Cualquier otra falla (por ejemplo, no se pudo escribir en el disco)
  return new FileSaveError(error);
};

// folder: subcarpeta de uploads/ (ver UPLOAD_FOLDERS en constants)
export const uploadSingleFile = (folder) => {
  const upload = createUploader(folder).single(FILE_UPLOAD.FIELD_NAME);

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (error) return next(toAppError(error));
      next();
    });
  };
};
