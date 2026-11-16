import * as loggerService from "../services/logger.service.js";

// El Controller solo llama al Service y responde. Los errores se pasan con next(error).

export const testLogger = (req, res, next) => {
  try {
    const result = loggerService.testLogger();
    res.status(200).json({ status: "success", payload: result });
  } catch (error) {
    next(error);
  }
};
