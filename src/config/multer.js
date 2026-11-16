import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { config } from "./env.config.js";
import logger from "./logger.js";
import { ENVIRONMENTS, FILE_UPLOAD, ALLOWED_MIME_TYPE_VALUES } from "../constants/index.js";
import { InvalidFileTypeError } from "../errors/index.js";

// Configuración CENTRALIZADA de Multer (la librería que recibe archivos multipart/form-data).
// Acá se define: dónde se guardan los archivos, cómo se nombran, qué tipos se aceptan y el tamaño máximo.
// Los routers NO configuran Multer: solo usan el middleware de src/middlewares/upload.middleware.js.

// Raíz del proyecto, sin importar desde dónde se ejecute node
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Carpeta de uploads. Los tests usan otra carpeta para no mezclar sus archivos con los reales.
// Las dos están en .gitignore: los archivos subidos no van al repositorio.
const isTest = config?.nodeEnv === ENVIRONMENTS.TEST;
export const UPLOADS_DIR = path.join(PROJECT_ROOT, isTest ? "uploads-test" : "uploads");

// Dónde se guarda: uploads/<subcarpeta>/ (la carpeta se crea sola si no existe)
const buildStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, callback) => {
      const destination = path.join(UPLOADS_DIR, folder);
      fs.mkdir(destination, { recursive: true }, (error) => callback(error, destination));
    },
    // Cómo se nombra: <fecha>-<id aleatorio>.<extensión según el tipo>.
    // Así dos archivos nunca se pisan y el nombre original del usuario no se usa en el disco.
    filename: (req, file, callback) => {
      const extension = FILE_UPLOAD.ALLOWED_MIME_TYPES[file.mimetype];
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  });

// Qué tipos se aceptan: si el tipo no está permitido, se rechaza con un error del dominio
const fileFilter = (req, file, callback) => {
  if (FILE_UPLOAD.ALLOWED_MIME_TYPES[file.mimetype]) {
    return callback(null, true);
  }

  logger.warning(`Intento de subir un archivo con tipo no permitido: "${file.mimetype}" (${file.originalname})`);
  callback(new InvalidFileTypeError(file.mimetype, ALLOWED_MIME_TYPE_VALUES));
};

// Crea el "uploader" de una subcarpeta: guarda ahí, filtra tipos y limita el tamaño y la cantidad
export const createUploader = (folder) =>
  multer({
    storage: buildStorage(folder),
    fileFilter,
    limits: { fileSize: FILE_UPLOAD.MAX_SIZE_BYTES, files: 1 }
  });

export { multer };
