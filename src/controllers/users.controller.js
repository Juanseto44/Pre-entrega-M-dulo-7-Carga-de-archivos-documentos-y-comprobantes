import * as usersService from "../services/users.service.js";

// El Controller es la puerta de entrada HTTP: toma los datos de req, llama al Service
// y responde con el código de estado correcto. No tiene reglas de negocio ni conoce Mongoose.
// Los errores se pasan con next(error) al middleware de errores.

export const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getUsers();
    res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body || {});
    res.status(201).json({ status: "success", payload: user });
  } catch (error) {
    next(error);
  }
};

// El archivo ya lo guardó Multer (middleware de la ruta): llega en req.file.
// El tipo de documento llega como campo de texto del formulario, en req.body.
export const addUserDocument = async (req, res, next) => {
  try {
    const user = await usersService.addUserDocument(req.params.id, req.file, req.body || {});
    res.status(201).json({ status: "success", payload: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body || {});
    res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await usersService.deleteUser(req.params.id);
    res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    next(error);
  }
};
