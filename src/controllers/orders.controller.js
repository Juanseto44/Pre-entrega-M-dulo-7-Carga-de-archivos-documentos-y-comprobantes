import * as ordersService from "../services/orders.service.js";

// El Controller solo toma los datos de la petición, llama al Service y responde.
// Los errores se pasan con next(error) al middleware de errores.

export const getOrders = async (req, res, next) => {
  try {
    const orders = await ordersService.getOrders(req.query.status);
    res.status(200).json({ status: "success", payload: orders });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body || {});
    res.status(201).json({ status: "success", payload: order });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id);
    res.status(200).json({ status: "success", payload: order });
  } catch (error) {
    next(error);
  }
};
