import * as productsService from "../services/products.service.js";

// El Controller es la puerta de entrada HTTP: toma los datos de req, llama al Service
// y responde con el código de estado correcto. No tiene reglas de negocio ni conoce Mongoose.
// Los errores se pasan con next(error) al middleware de errores.

export const getProducts = async (req, res, next) => {
  try {
    const products = await productsService.getProducts();
    res.status(200).json({ status: "success", payload: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.id);
    res.status(200).json({ status: "success", payload: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productsService.createProduct(req.body || {});
    res.status(201).json({ status: "success", payload: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body || {});
    res.status(200).json({ status: "success", payload: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await productsService.deleteProduct(req.params.id);
    res.status(200).json({ status: "success", payload: product });
  } catch (error) {
    next(error);
  }
};
