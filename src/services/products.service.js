import logger from "../config/logger.js";
import productsRepository from "../repositories/products.repository.js";
import { PRODUCT_STATUS } from "../constants/index.js";
import { InvalidDataError, InvalidIdError, ProductNotFoundError } from "../errors/index.js";
import { isFilledString, isValidId, toNumber } from "../utils/validators.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.
// Cuando algo está mal, lanza un error del dominio (carpeta errors/); no responde nada él mismo.

// Campos que se pueden enviar al crear o editar. El estado NO está: lo calcula el service.
const EDITABLE_FIELDS = ["name", "description", "price", "stock"];

// Regla de negocio: el estado depende del stock
const getStatusFromStock = (stock) =>
  stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;

// Valida los campos enviados y devuelve solo los permitidos, ya convertidos.
// isCreation = true exige los obligatorios; en una edición solo se validan los enviados.
// Junta TODOS los problemas y los informa juntos en `details`.
const validateProductFields = (body, isCreation) => {
  const data = {};
  const errors = [];

  if (body.name !== undefined || isCreation) {
    if (isFilledString(body.name)) {
      data.name = body.name.trim();
    } else {
      errors.push({ field: "name", message: "El nombre es obligatorio" });
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description === "string") {
      data.description = body.description.trim();
    } else {
      errors.push({ field: "description", message: "La descripción debe ser un texto" });
    }
  }

  if (body.price !== undefined || isCreation) {
    const price = toNumber(body.price);
    if (Number.isFinite(price) && price >= 0) {
      data.price = price;
    } else {
      errors.push({ field: "price", message: "El precio debe ser un número mayor o igual a 0" });
    }
  }

  if (body.stock !== undefined || isCreation) {
    const stock = toNumber(body.stock);
    if (Number.isInteger(stock) && stock >= 0) {
      data.stock = stock;
      data.status = getStatusFromStock(stock);
    } else {
      errors.push({ field: "stock", message: "El stock debe ser un número entero mayor o igual a 0" });
    }
  }

  if (errors.length > 0) {
    throw new InvalidDataError("Los datos del producto no son válidos", errors);
  }

  return data;
};

const checkValidId = (id) => {
  if (!isValidId(id)) {
    throw new InvalidIdError("producto");
  }
};

export const getProducts = async () => {
  // Regla de negocio: el listado solo muestra productos con stock disponible.
  // El service decide QUÉ mostrar; el repository sabe CÓMO buscarlo.
  return await productsRepository.getAll({ status: PRODUCT_STATUS.AVAILABLE });
};

export const getProductById = async (id) => {
  checkValidId(id);

  const product = await productsRepository.getById(id);
  if (!product) {
    throw new ProductNotFoundError();
  }
  return product;
};

export const createProduct = async (body) => {
  const data = validateProductFields(body, true);
  const product = await productsRepository.create(data);
  logger.info(`Producto creado: ${product._id} (${product.name})`);
  return product;
};

export const updateProduct = async (id, body) => {
  // Verifica el id y que el producto exista antes de modificarlo
  await getProductById(id);

  const data = validateProductFields(body, false);
  if (Object.keys(data).length === 0) {
    throw new InvalidDataError(
      `No se enviaron campos para actualizar. Campos permitidos: ${EDITABLE_FIELDS.join(", ")}`
    );
  }

  const product = await productsRepository.update(id, data);
  logger.info(`Producto actualizado: ${id}`);
  return product;
};

export const deleteProduct = async (id) => {
  await getProductById(id);
  const product = await productsRepository.delete(id);
  logger.info(`Producto eliminado: ${id}`);
  return product;
};
