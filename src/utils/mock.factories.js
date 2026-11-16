import { fakerES as faker } from "@faker-js/faker";
import { InvalidStatusError } from "../errors/index.js";
import {
  USER_ROLE_VALUES,
  ORDER_STATUS_VALUES,
  ORDER_PRIORITY_VALUES,
  DELIVERY_STATUS,
  DELIVERY_STATUS_BY_ORDER_STATUS
} from "../constants/index.js";

// Generadores de datos falsos con faker (versión en español).
// Son funciones "puras": solo arman objetos, no tocan la base de datos.
// Los campos y valores son los mismos que definen los modelos y las constantes.

const MOCK_EMAIL_DOMAIN = "test.com";
const MAX_EMAIL_ATTEMPTS = 50;

// "Pérez Gómez" -> "perezgomez" (sin acentos, espacios ni símbolos)
const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const buildAddress = () => `${faker.location.streetAddress()}, ${faker.location.city()}`;

// Un id con formato de MongoDB. Sirve para las relaciones de los datos que NO se guardan.
export const buildFakeId = () => faker.database.mongodbObjectId();

// takenEmails: emails ya usados (en este lote o en la base). Evita repetidos, porque el email es único.
const buildUser = (role, takenEmails) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  let email;
  let attempts = 0;
  do {
    if (attempts++ >= MAX_EMAIL_ATTEMPTS) {
      throw new Error(`No se pudo generar un email único para ${firstName} ${lastName}`);
    }
    const number = faker.number.int({ min: 1, max: 9999 });
    email = `${slugify(firstName)}.${slugify(lastName)}${number}@${MOCK_EMAIL_DOMAIN}`;
  } while (takenEmails.has(email));
  takenEmails.add(email);

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    // Si no se indica un rol, se elige uno válido al azar
    role: role ?? faker.helpers.arrayElement(USER_ROLE_VALUES)
  };
};

const buildOrderItem = () => ({
  description: faker.commerce.productName(),
  quantity: faker.number.int({ min: 1, max: 5 }),
  weight: faker.number.int({ min: 1, max: 300 }) / 10 // peso de una unidad: de 0.1 a 30 kg
});

// userId: el cliente que hizo el pedido. Cada pedido tiene entre 1 y 4 items.
const buildOrder = (userId) => ({
  user: userId,
  items: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, buildOrderItem),
  originAddress: buildAddress(),
  destinationAddress: buildAddress(),
  status: faker.helpers.arrayElement(ORDER_STATUS_VALUES),
  priority: faker.helpers.arrayElement(ORDER_PRIORITY_VALUES)
});

// order: { id, status }. El estado de la entrega sale del estado del pedido.
// Solo las entregas que no están pendientes tienen repartidor.
const buildDelivery = (order, courierIds) => {
  const status = DELIVERY_STATUS_BY_ORDER_STATUS[order.status];
  if (!status) {
    // Un pedido cancelado (o con un estado desconocido) no tiene entrega
    throw new InvalidStatusError(order.status, Object.keys(DELIVERY_STATUS_BY_ORDER_STATUS));
  }

  const hasCourier = status !== DELIVERY_STATUS.PENDING;
  return {
    order: order.id,
    courier: hasCourier ? faker.helpers.arrayElement(courierIds) : null,
    status,
    scheduledDate: hasCourier ? faker.date.recent({ days: 7 }) : faker.date.soon({ days: 7 })
  };
};

// ------------------------------------------------------------------
// Generadores de listas (los que usa el service)
// ------------------------------------------------------------------

export const buildUsers = (qty, { role, takenEmails = new Set() } = {}) =>
  Array.from({ length: qty }, () => buildUser(role, takenEmails));

export const buildOrders = (qty, userIds) =>
  Array.from({ length: qty }, () => buildOrder(faker.helpers.arrayElement(userIds)));

export const buildDeliveries = (orders, courierIds) =>
  orders.map((order) => buildDelivery(order, courierIds));

// Pedidos inventados (solo id y estado) para armar entregas que no se guardan.
// Solo se usan estados que tienen entrega.
export const buildFakeOrderRefs = (qty) =>
  Array.from({ length: qty }, () => ({
    id: buildFakeId(),
    status: faker.helpers.arrayElement(Object.keys(DELIVERY_STATUS_BY_ORDER_STATUS))
  }));
