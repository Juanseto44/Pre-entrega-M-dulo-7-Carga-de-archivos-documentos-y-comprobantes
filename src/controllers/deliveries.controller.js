import * as deliveriesService from "../services/deliveries.service.js";

// El Controller solo toma los datos de la petición, llama al Service y responde.
// Los errores se pasan con next(error) al middleware de errores.

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveriesService.getDeliveries(req.query.status);
    res.status(200).json({ status: "success", payload: deliveries });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const deliverie = await deliveriesService.getDeliveryById(req.params.id);
    res.status(200).json({ status: "success", payload: deliverie });
  } catch (error) {
    next(error);
  }
};

// El archivo ya lo guardó Multer (middleware de la ruta): llega en req.file
export const addDeliveryReceipt = async (req, res, next) => {
  try {
    const delivery = await deliveriesService.addDeliveryReceipt(req.params.id, req.file);
    res.status(201).json({ status: "success", payload: delivery });
  } catch (error) {
    next(error);
  }
};
