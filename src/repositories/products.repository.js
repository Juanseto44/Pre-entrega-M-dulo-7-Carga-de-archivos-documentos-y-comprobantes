import Product from "../models/Product.js";

// El Repository es el UNICO lugar que conoce Mongoose y MongoDB.
// Su trabajo es buscar y guardar datos; no decide reglas de negocio.
// Encapsula el acceso: orden por defecto, campos que se devuelven y cómo se arma la consulta.

// Proyección: campos que NO queremos traer (__v es un campo interno de Mongoose)
const HIDDEN_FIELDS = "-__v";

class ProductsRepository {
  // Devuelve los productos, los más nuevos primero.
  // Si se indica `status`, solo trae los de ese estado.
  async getAll({ status } = {}) {
    const filter = {};
    if (status) filter.status = status;

    return await Product.find(filter).select(HIDDEN_FIELDS).sort({ createdAt: -1 }).lean();
  }

  async getById(id) {
    return await Product.findById(id).select(HIDDEN_FIELDS).lean();
  }

  async create(productData) {
    const createdProduct = await Product.create(productData);
    return createdProduct.toObject({ versionKey: false });
  }

  // Devuelve el producto ya actualizado (o null si no existe)
  async update(id, data) {
    return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(HIDDEN_FIELDS)
      .lean();
  }

  // Devuelve el producto eliminado (o null si no existe)
  async delete(id) {
    return await Product.findByIdAndDelete(id).select(HIDDEN_FIELDS).lean();
  }
}

// Se exporta una única instancia que se comparte en toda la app
export default new ProductsRepository();
