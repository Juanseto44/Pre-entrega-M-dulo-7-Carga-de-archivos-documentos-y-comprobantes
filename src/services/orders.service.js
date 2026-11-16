import logger from "../config/logger.js";
import ordersRepository from "../repositories/orders.repository.js";
import usersRepository from "../repositories/users.repository.js";
import { ORDER_STATUS_VALUES, ORDER_PRIORITY_VALUES } from "../constants/index.js";
import {
  InvalidDataError,
  InvalidIdError,
  InvalidStatusError,
  OrderNotFoundError,
  UserNotFoundError
} from "../errors/index.js";
import { isFilledString, isValidId } from "../utils/validators.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.
// Cuando algo está mal, lanza un error del dominio (carpeta errors/); no responde nada él mismo.

// Valida un item del pedido y devuelve el item ya normalizado.
// Si algo falla, agrega el problema a `errors` (así se informan todos juntos).
const validateItem = (item, index, errors) => {
  const prefix = `items[${index}]`;

  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    errors.push({ field: prefix, message: "Cada item debe ser un objeto con description, quantity y weight" });
    return null;
  }

  if (!isFilledString(item.description)) {
    errors.push({ field: `${prefix}.description`, message: "El campo description es obligatorio" });
  }
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    errors.push({ field: `${prefix}.quantity`, message: "quantity debe ser un número entero mayor o igual a 1" });
  }
  if (typeof item.weight !== "number" || !Number.isFinite(item.weight) || item.weight < 0) {
    errors.push({ field: `${prefix}.weight`, message: "weight debe ser un número mayor o igual a 0" });
  }

  return { description: item.description?.trim(), quantity: item.quantity, weight: item.weight };
};

// Valida el body para crear un pedido y devuelve solo los campos permitidos, ya normalizados.
// Junta TODOS los problemas y los informa juntos en `details`.
// El estado no se recibe: un pedido nuevo siempre empieza en "pending" (valor por defecto del modelo).
const validateOrderFields = (body) => {
  const errors = [];
  const data = {};

  if (isValidId(body.user)) {
    data.user = body.user;
  } else {
    errors.push({ field: "user", message: "El campo user es obligatorio y debe ser un id válido" });
  }

  if (Array.isArray(body.items) && body.items.length > 0) {
    data.items = body.items.map((item, index) => validateItem(item, index, errors));
  } else {
    errors.push({ field: "items", message: "El campo items debe ser una lista con al menos un item" });
  }

  for (const field of ["originAddress", "destinationAddress"]) {
    if (isFilledString(body[field])) {
      data[field] = body[field].trim();
    } else {
      errors.push({ field, message: `El campo ${field} es obligatorio` });
    }
  }

  if (body.priority !== undefined) {
    if (ORDER_PRIORITY_VALUES.includes(body.priority)) {
      data.priority = body.priority;
    } else {
      errors.push({ field: "priority", message: `La prioridad debe ser una de: ${ORDER_PRIORITY_VALUES.join(", ")}` });
    }
  }

  if (errors.length > 0) {
    throw new InvalidDataError("Los datos del pedido no son válidos", errors);
  }

  return data;
};

// status (opcional): filtra los pedidos por estado
export const getOrders = async (status) => {
  if (status !== undefined && !ORDER_STATUS_VALUES.includes(status)) {
    throw new InvalidStatusError(status, ORDER_STATUS_VALUES);
  }

  return await ordersRepository.getAll({ status });
};

export const getOrderById = async (id) => {
  if (!isValidId(id)) {
    throw new InvalidIdError("pedido");
  }

  const order = await ordersRepository.getById(id);
  if (!order) {
    throw new OrderNotFoundError();
  }
  return order;
};

export const createOrder = async (body) => {
  const data = validateOrderFields(body);

  // Regla de negocio: el usuario que hace el pedido tiene que existir
  const user = await usersRepository.getById(data.user);
  if (!user) {
    throw new UserNotFoundError();
  }

  const order = await ordersRepository.create(data);
  logger.info(`Pedido creado: ${order._id} (usuario: ${data.user})`);
  return order;
};
