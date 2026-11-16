import Order from "../models/Order.js";

// El Repository es el UNICO lugar que conoce Mongoose y MongoDB.

// Proyección: campos que NO queremos traer (__v es un campo interno de Mongoose)
const HIDDEN_FIELDS = "-__v";

class OrdersRepository {
  // Nombre real de la colección en MongoDB
  get collectionName() {
    return Order.collection.name;
  }

  // Devuelve los pedidos, los más nuevos primero.
  // Si se indica `status`, solo trae los de ese estado.
  async getAll({ status } = {}) {
    const filter = {};
    if (status) filter.status = status;

    return await Order.find(filter).select(HIDDEN_FIELDS).sort({ createdAt: -1 }).lean();
  }

  async getById(id) {
    return await Order.findById(id).select(HIDDEN_FIELDS).lean();
  }

  // Crea un pedido. Mongoose lo valida contra el esquema.
  async create(orderData) {
    const createdOrder = await Order.create(orderData);
    return createdOrder.toObject({ versionKey: false });
  }

  // Inserta varios pedidos juntos. Mongoose valida cada uno contra el esquema.
  async createMany(ordersData) {
    const createdOrders = await Order.insertMany(ordersData);
    return createdOrders.map((order) => order.toObject({ versionKey: false }));
  }
}

export default new OrdersRepository();
