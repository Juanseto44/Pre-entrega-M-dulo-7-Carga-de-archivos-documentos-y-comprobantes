import logger from "../config/logger.js";
import usersRepository from "../repositories/users.repository.js";
import {
  USER_ROLES,
  USER_ROLE_VALUES,
  USER_DOCUMENT_TYPES,
  USER_DOCUMENT_TYPE_VALUES,
  FILE_UPLOAD
} from "../constants/index.js";
import {
  AppError,
  InvalidDataError,
  InvalidIdError,
  UserNotFoundError,
  EmailAlreadyRegisteredError,
  FileRequiredError,
  InvalidDocumentTypeError,
  FileSaveError
} from "../errors/index.js";
import { isFilledString, isValidEmail, isValidId } from "../utils/validators.js";
import { buildFileMetadata, removeFile } from "../utils/files.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.
// Cuando algo está mal, lanza un error del dominio (carpeta errors/); no responde nada él mismo.

const EDITABLE_FIELDS = ["first_name", "last_name", "email", "role"];

// Valida los campos enviados y devuelve solo los permitidos, ya normalizados.
// isCreation = true exige los obligatorios; en una edición solo se validan los enviados.
// Junta TODOS los problemas y los informa juntos en `details`.
const validateUserFields = (body, isCreation) => {
  const data = {};
  const errors = [];

  for (const field of ["first_name", "last_name"]) {
    if (body[field] !== undefined || isCreation) {
      if (isFilledString(body[field])) {
        data[field] = body[field].trim();
      } else {
        errors.push({ field, message: `El campo ${field} es obligatorio` });
      }
    }
  }

  if (body.email !== undefined || isCreation) {
    if (isValidEmail(body.email)) {
      data.email = body.email.trim().toLowerCase();
    } else {
      errors.push({ field: "email", message: "El email no es válido" });
    }
  }

  if (body.role !== undefined) {
    if (USER_ROLE_VALUES.includes(body.role)) {
      data.role = body.role;
    } else {
      errors.push({ field: "role", message: `El rol debe ser uno de: ${USER_ROLE_VALUES.join(", ")}` });
    }
  } else if (isCreation) {
    data.role = USER_ROLES.USER; // rol por defecto
  }

  if (errors.length > 0) {
    throw new InvalidDataError("Los datos del usuario no son válidos", errors);
  }

  return data;
};

// Regla de negocio: no puede haber dos usuarios con el mismo email.
// `currentUserId` permite que un usuario conserve su propio email al editarse.
const checkEmailAvailable = async (email, currentUserId = null) => {
  const existingUser = await usersRepository.getByEmail(email);
  if (existingUser && existingUser._id.toString() !== currentUserId) {
    throw new EmailAlreadyRegisteredError();
  }
};

export const getUsers = async () => {
  return await usersRepository.getAll();
};

export const getUserById = async (id) => {
  if (!isValidId(id)) {
    throw new InvalidIdError("usuario");
  }

  const user = await usersRepository.getById(id);
  if (!user) {
    throw new UserNotFoundError();
  }
  return user;
};

export const createUser = async (body) => {
  const data = validateUserFields(body, true);
  await checkEmailAvailable(data.email);
  const user = await usersRepository.create(data);
  logger.info(`Usuario creado: ${user._id} (rol: ${user.role})`);
  return user;
};

export const updateUser = async (id, body) => {
  // Verifica el id y que el usuario exista antes de modificarlo
  await getUserById(id);

  const data = validateUserFields(body, false);
  if (Object.keys(data).length === 0) {
    throw new InvalidDataError(
      `No se enviaron campos para actualizar. Campos permitidos: ${EDITABLE_FIELDS.join(", ")}`
    );
  }

  if (data.email) {
    await checkEmailAvailable(data.email, id);
  }

  const user = await usersRepository.update(id, data);
  logger.info(`Usuario actualizado: ${id}`);
  return user;
};

export const deleteUser = async (id) => {
  await getUserById(id);
  const user = await usersRepository.delete(id);
  logger.info(`Usuario eliminado: ${id}`);
  return user;
};

// Si no se envía documentType se usa "other". Si se envía, tiene que ser uno de los permitidos.
const validateDocumentType = (documentType) => {
  if (documentType === undefined) return USER_DOCUMENT_TYPES.OTHER;

  if (!USER_DOCUMENT_TYPE_VALUES.includes(documentType)) {
    throw new InvalidDocumentTypeError(documentType, USER_DOCUMENT_TYPE_VALUES);
  }
  return documentType;
};

// Asocia un documento (ya guardado en el disco por Multer) a un usuario.
// `file` es req.file. Si algo falla, el archivo se borra del disco para no dejar archivos sueltos.
export const addUserDocument = async (id, file, body) => {
  try {
    if (!file) {
      throw new FileRequiredError(FILE_UPLOAD.FIELD_NAME);
    }
    if (!isValidId(id)) {
      throw new InvalidIdError("usuario");
    }
    const documentType = validateDocumentType(body.documentType);

    // Regla de negocio: el usuario tiene que existir
    await getUserById(id);

    const user = await usersRepository.addDocument(id, buildFileMetadata(file, documentType));
    logger.info(`Documento cargado: usuario ${id}, tipo ${documentType}, archivo ${file.filename} (${file.size} bytes)`);
    return user;
  } catch (error) {
    await removeFile(file);
    // Los errores esperados pasan tal cual; cualquier otra falla viene del guardado
    throw error instanceof AppError ? error : new FileSaveError(error);
  }
};
