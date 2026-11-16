import User from "../models/User.js";

// El Repository es el UNICO lugar que conoce Mongoose y MongoDB.
// Su trabajo es buscar y guardar datos; no decide reglas de negocio.

// Proyección: campos que NO queremos traer (__v es un campo interno de Mongoose)
const HIDDEN_FIELDS = "-__v";

class UsersRepository {
  // Nombre real de la colección en MongoDB
  get collectionName() {
    return User.collection.name;
  }

  // Devuelve todos los usuarios, los más nuevos primero
  async getAll() {
    return await User.find().select(HIDDEN_FIELDS).sort({ createdAt: -1 }).lean();
  }

  async getById(id) {
    return await User.findById(id).select(HIDDEN_FIELDS).lean();
  }

  // El email se guarda en minúsculas, así que se busca igual: "ANA@mail.com" encuentra "ana@mail.com"
  async getByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() }).select(HIDDEN_FIELDS).lean();
  }

  // Devuelve los usuarios que tienen un rol determinado (por ejemplo, los repartidores)
  async getByRole(role) {
    return await User.find({ role }).select(HIDDEN_FIELDS).lean();
  }

  async create(userData) {
    const createdUser = await User.create(userData);
    return createdUser.toObject({ versionKey: false });
  }

  // Inserta varios usuarios juntos. Mongoose valida cada uno contra el esquema.
  async createMany(usersData) {
    const createdUsers = await User.insertMany(usersData);
    return createdUsers.map((user) => user.toObject({ versionKey: false }));
  }

  // Devuelve el usuario ya actualizado (o null si no existe)
  async update(id, data) {
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(HIDDEN_FIELDS)
      .lean();
  }

  // Agrega los metadatos de un documento al usuario y lo devuelve actualizado (o null si no existe)
  async addDocument(id, fileMetadata) {
    return await User.findByIdAndUpdate(
      id,
      { $push: { documents: fileMetadata } },
      { new: true, runValidators: true }
    )
      .select(HIDDEN_FIELDS)
      .lean();
  }

  // Devuelve el usuario eliminado (o null si no existe)
  async delete(id) {
    return await User.findByIdAndDelete(id).select(HIDDEN_FIELDS).lean();
  }
}

export default new UsersRepository();
