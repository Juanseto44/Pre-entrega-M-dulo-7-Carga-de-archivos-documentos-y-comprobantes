import Delivery from "../models/Delivery.js";

// El Repository es el UNICO lugar que conoce Mongoose y MongoDB.

// Proyección: campos que NO queremos traer (__v es un campo interno de Mongoose)
const HIDDEN_FIELDS = "-__v";

class DeliveriesRepository {
  // Nombre real de la colección en MongoDB
  get collectionName() {
    return Delivery.collection.name;
  }

  // Devuelve las entregas, las más nuevas primero.
  // Si se indica `status`, solo trae las de ese estado.
  async getAll({ status } = {}) {
    const filter = {};
    if (status) filter.status = status;

    return await Delivery.find(filter).select(HIDDEN_FIELDS).sort({ createdAt: -1 }).lean();
  }

  async getById(id) {
    return await Delivery.findById(id).select(HIDDEN_FIELDS).lean();
  }

  // Agrega los metadatos de un comprobante a la entrega y la devuelve actualizada (o null si no existe)
  async addReceipt(id, fileMetadata) {
    return await Delivery.findByIdAndUpdate(
      id,
      { $push: { receipts: fileMetadata } },
      { new: true, runValidators: true }
    )
      .select(HIDDEN_FIELDS)
      .lean();
  }

  // Devuelve los ids (como texto) de los pedidos que ya tienen una entrega
  async getOrderIds() {
    const deliveries = await Delivery.find().select("order").lean();
    return deliveries.map((delivery) => delivery.order.toString());
  }

  // Inserta varias entregas juntas. Mongoose valida cada una contra el esquema.
  async createMany(deliveriesData) {
    const createdDeliveries = await Delivery.insertMany(deliveriesData);
    return createdDeliveries.map((delivery) => delivery.toObject({ versionKey: false }));
  }
}

export default new DeliveriesRepository();
