import logger from "../config/logger.js";
import deliveriesRepository from "../repositories/deliveries.repository.js";
import { DELIVERY_STATUS_VALUES, FILE_UPLOAD, RECEIPT_DOCUMENT_TYPE } from "../constants/index.js";
import {
  AppError,
  InvalidIdError,
  InvalidStatusError,
  DeliveryNotFoundError,
  FileRequiredError,
  FileSaveError
} from "../errors/index.js";
import { isValidId } from "../utils/validators.js";
import { buildFileMetadata, removeFile } from "../utils/files.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.
// Cuando algo está mal, lanza un error del dominio (carpeta errors/); no responde nada él mismo.

// status (opcional): filtra las entregas por estado
export const getDeliveries = async (status) => {
  if (status !== undefined && !DELIVERY_STATUS_VALUES.includes(status)) {
    throw new InvalidStatusError(status, DELIVERY_STATUS_VALUES);
  }

  return await deliveriesRepository.getAll({ status });
};

export const getDeliveryById = async (id) => {
  if (!isValidId(id)) {
    throw new InvalidIdError("entrega");
  }

  const delivery = await deliveriesRepository.getById(id);
  if (!delivery) {
    throw new DeliveryNotFoundError();
  }
  return delivery;
};

// Asocia un comprobante de entrega (ya guardado en el disco por Multer) a una entrega.
// `file` es req.file. Si algo falla, el archivo se borra del disco para no dejar archivos sueltos.
export const addDeliveryReceipt = async (id, file) => {
  try {
    if (!file) {
      throw new FileRequiredError(FILE_UPLOAD.FIELD_NAME);
    }

    // Regla de negocio: la entrega tiene que existir
    await getDeliveryById(id);

    const delivery = await deliveriesRepository.addReceipt(id, buildFileMetadata(file, RECEIPT_DOCUMENT_TYPE));
    logger.info(`Comprobante asociado a la entrega ${id}: archivo ${file.filename} (${file.size} bytes)`);
    return delivery;
  } catch (error) {
    await removeFile(file);
    // Los errores esperados pasan tal cual; cualquier otra falla viene del guardado
    throw error instanceof AppError ? error : new FileSaveError(error);
  }
};
