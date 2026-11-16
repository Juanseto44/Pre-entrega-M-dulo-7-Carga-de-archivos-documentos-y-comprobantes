import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR, PROJECT_ROOT } from "../../src/config/multer.js";

// Utilidades para los archivos subidos durante los tests.
// En tests Multer guarda en "uploads-test/" (no en "uploads/"), así no se mezclan con archivos reales.

// Seguridad: solo se borra la carpeta de uploads de los tests
const assertTestUploadsDir = () => {
  if (path.basename(UPLOADS_DIR) !== "uploads-test") {
    throw new Error(`Por seguridad solo se borra "uploads-test". Carpeta actual: "${UPLOADS_DIR}"`);
  }
};

// Borra todos los archivos subidos por los tests
export const clearUploads = async () => {
  assertTestUploadsDir();
  await fs.rm(UPLOADS_DIR, { recursive: true, force: true });
};

// Lista (recursivamente) los archivos que hay en la carpeta de uploads de los tests
export const listUploadedFiles = async (directory = UPLOADS_DIR) => {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listUploadedFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

// Lee un archivo guardado a partir de la ruta relativa que devuelve la API (ej: uploads-test/documents/x.pdf)
export const readStoredFile = async (relativePath) => fs.readFile(path.join(PROJECT_ROOT, relativePath));
