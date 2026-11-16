import * as mocksService from "../services/mocks.service.js";

// El Controller solo toma los datos de la petición (req.query), llama al Service y responde.
// Los endpoints de mocks responden directamente con los datos (sin envoltorio), como en el ejemplo de la consigna.

export const getMockUsers = (req, res, next) => {
  try {
    res.status(200).json(mocksService.getMockUsers(req.query.qty));
  } catch (error) {
    next(error);
  }
};

export const getMockCouriers = (req, res, next) => {
  try {
    res.status(200).json(mocksService.getMockCouriers(req.query.qty));
  } catch (error) {
    next(error);
  }
};

export const getMockOrders = (req, res, next) => {
  try {
    res.status(200).json(mocksService.getMockOrders(req.query.qty));
  } catch (error) {
    next(error);
  }
};

export const getMockDeliveries = (req, res, next) => {
  try {
    res.status(200).json(mocksService.getMockDeliveries(req.query.qty));
  } catch (error) {
    next(error);
  }
};

export const seedMocks = async (req, res, next) => {
  try {
    const result = await mocksService.seedMocks(req.query.type, req.query.qty);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
