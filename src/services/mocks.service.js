import logger from "../config/logger.js";
import usersRepository from "../repositories/users.repository.js";
import ordersRepository from "../repositories/orders.repository.js";
import deliveriesRepository from "../repositories/deliveries.repository.js";
import {
  USER_ROLES,
  MOCK_LIMITS,
  MOCK_TYPES,
  MOCK_TYPE_VALUES,
  DELIVERY_STATUS,
  DELIVERY_STATUS_BY_ORDER_STATUS
} from "../constants/index.js";
import {
  AppError,
  InvalidQuantityError,
  NegativeQuantityError,
  InvalidMockTypeError,
  MockPrerequisiteError,
  MockGenerationError,
  MockInsertError
} from "../errors/index.js";
import {
  buildFakeId,
  buildUsers,
  buildOrders,
  buildDeliveries,
  buildFakeOrderRefs
} from "../utils/mock.factories.js";
import { toNumber } from "../utils/validators.js";

// Lógica del módulo de mocking.
// Dos usos:
//  - get...: devuelve datos simulados SIN guardarlos.
//  - seed: los genera y los guarda en MongoDB a través de los repositories.
// Las relaciones (pedido -> usuario, entrega -> pedido, entrega -> repartidor) se respetan en ambos casos.
// Los problemas se informan con errores del dominio (carpeta errors/); acá no se responde nada.

const { DEFAULT_QTY, MAX_QTY } = MOCK_LIMITS;

// Cuántos clientes / repartidores inventados se usan para relacionar datos que no se guardan
const FAKE_POOL_SIZE = 3;

// Valida el parámetro ?qty=. Si no se envía, usa el valor por defecto.
const validateQty = (qty) => {
  if (qty === undefined) return DEFAULT_QTY;

  const number = toNumber(qty);
  if (Number.isFinite(number) && number < 0) {
    throw new NegativeQuantityError();
  }
  if (!Number.isInteger(number) || number < 1 || number > MAX_QTY) {
    throw new InvalidQuantityError(MAX_QTY);
  }
  return number;
};

// Valida el parámetro ?type=. Si no se envía, se cargan usuarios.
const validateType = (type) => {
  if (type === undefined) return MOCK_TYPES.USERS;

  if (!MOCK_TYPE_VALUES.includes(type)) {
    throw new InvalidMockTypeError(MOCK_TYPE_VALUES);
  }
  return type;
};

// Regla: un pedido con estado "pending" genera una entrega pendiente (sin repartidor);
// los demás estados con entrega necesitan repartidor. Un pedido cancelado no tiene entrega.
const hasDelivery = (orderStatus) => orderStatus in DELIVERY_STATUS_BY_ORDER_STATUS;
const needsCourier = (orderStatus) =>
  hasDelivery(orderStatus) && DELIVERY_STATUS_BY_ORDER_STATUS[orderStatus] !== DELIVERY_STATUS.PENDING;

const buildFakeIds = (size) => Array.from({ length: size }, buildFakeId);

// Ejecuta un generador de datos. Si falla por algo inesperado, lo informa como MockGenerationError.
// Los errores esperados (AppError) se dejan pasar tal cual.
const generate = (generator) => {
  try {
    return generator();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new MockGenerationError(error);
  }
};

// ------------------------------------------------------------------
// Datos simulados (no se guardan)
// ------------------------------------------------------------------

const logGenerated = (quantity, description) => {
  logger.info(`Mocks: se generaron ${quantity} ${description} simulados (no se guardaron)`);
};

export const getMockUsers = (qty) => {
  const quantity = validateQty(qty);
  const users = generate(() => buildUsers(quantity));
  logGenerated(quantity, "usuarios");
  return users;
};

export const getMockCouriers = (qty) => {
  const quantity = validateQty(qty);
  const couriers = generate(() => buildUsers(quantity, { role: USER_ROLES.COURIER }));
  logGenerated(quantity, "repartidores");
  return couriers;
};

// Los pedidos apuntan a ids de clientes inventados (no existen en la base)
export const getMockOrders = (qty) => {
  const quantity = validateQty(qty);
  const orders = generate(() => buildOrders(quantity, buildFakeIds(FAKE_POOL_SIZE)));
  logGenerated(quantity, "pedidos");
  return orders;
};

// Cada entrega apunta a un pedido inventado y, si corresponde, a un repartidor inventado
export const getMockDeliveries = (qty) => {
  const quantity = validateQty(qty);
  const deliveries = generate(() =>
    buildDeliveries(buildFakeOrderRefs(quantity), buildFakeIds(FAKE_POOL_SIZE))
  );
  logGenerated(quantity, "entregas");
  return deliveries;
};

// ------------------------------------------------------------------
// Carga de datos de prueba (se guardan en MongoDB)
// ------------------------------------------------------------------

const buildSeedResult = (inserted, repository) => ({
  insertados: inserted.length,
  coleccion: repository.collectionName
});

// Los emails son únicos: se arma el listado de los que ya existen para no repetirlos
const seedUsers = async (qty, role) => {
  const existingUsers = await usersRepository.getAll();
  const takenEmails = new Set(existingUsers.map((user) => user.email));

  const users = generate(() => buildUsers(qty, { role, takenEmails }));
  const inserted = await usersRepository.createMany(users);
  return buildSeedResult(inserted, usersRepository);
};

// Los pedidos se asignan a clientes (rol user) que ya existen en la base
const seedOrders = async (qty) => {
  const customers = await usersRepository.getByRole(USER_ROLES.USER);
  if (customers.length === 0) {
    throw new MockPrerequisiteError(
      `No hay usuarios con rol "${USER_ROLES.USER}". Cargá usuarios primero (type=${MOCK_TYPES.USERS}).`
    );
  }

  const customerIds = customers.map((customer) => customer._id);
  const orders = generate(() => buildOrders(qty, customerIds));
  const inserted = await ordersRepository.createMany(orders);
  return buildSeedResult(inserted, ordersRepository);
};

// Las entregas se crean sobre pedidos que ya existen, no están cancelados y todavía no tienen entrega
const seedDeliveries = async (qty) => {
  const orders = await ordersRepository.getAll();
  const orderIdsWithDelivery = new Set(await deliveriesRepository.getOrderIds());

  const availableOrders = orders.filter(
    (order) => hasDelivery(order.status) && !orderIdsWithDelivery.has(order._id.toString())
  );
  if (availableOrders.length === 0) {
    throw new MockPrerequisiteError(
      `No hay pedidos sin entrega. Cargá pedidos primero (type=${MOCK_TYPES.ORDERS}).`
    );
  }

  // Si hay menos pedidos disponibles que qty, se crean solo las entregas posibles
  const selectedOrders = availableOrders.slice(0, qty);

  // Los repartidores son usuarios con rol courier que ya existen en la base
  const couriers = await usersRepository.getByRole(USER_ROLES.COURIER);
  if (selectedOrders.some((order) => needsCourier(order.status)) && couriers.length === 0) {
    throw new MockPrerequisiteError(
      `No hay usuarios con rol "${USER_ROLES.COURIER}". Cargá repartidores primero (type=${MOCK_TYPES.COURIERS}).`
    );
  }

  const orderRefs = selectedOrders.map((order) => ({ id: order._id, status: order.status }));
  const courierIds = couriers.map((courier) => courier._id);

  const deliveries = generate(() => buildDeliveries(orderRefs, courierIds));
  const inserted = await deliveriesRepository.createMany(deliveries);
  return buildSeedResult(inserted, deliveriesRepository);
};

const seeders = {
  [MOCK_TYPES.USERS]: (qty) => seedUsers(qty),
  [MOCK_TYPES.COURIERS]: (qty) => seedUsers(qty, USER_ROLES.COURIER),
  [MOCK_TYPES.ORDERS]: seedOrders,
  [MOCK_TYPES.DELIVERIES]: seedDeliveries
};

export const seedMocks = async (type, qty) => {
  // Primero se validan los parámetros, antes de tocar la base
  const mockType = validateType(type);
  const quantity = validateQty(qty);

  logger.debug(`Mocks: carga de datos de prueba solicitada (type=${mockType}, qty=${quantity})`);

  try {
    const result = await seeders[mockType](quantity);
    // Para type=orders esto es el registro de los pedidos creados
    logger.info(
      `Mocks: se insertaron ${result.insertados} registros en la colección "${result.coleccion}" (type=${mockType})`
    );
    return result;
  } catch (error) {
    // Los errores esperados (parámetros, datos previos que faltan, etc.) pasan tal cual.
    // Cualquier otra falla viene de MongoDB: se informa de forma controlada, sin exponer detalles.
    if (error instanceof AppError) throw error;
    throw new MockInsertError(mockType, error);
  }
};
