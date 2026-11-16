import { Router } from "express";
import {
  getMockUsers,
  getMockCouriers,
  getMockOrders,
  getMockDeliveries,
  seedMocks
} from "../controllers/mocks.controller.js";

// Las rutas solo conectan un path con el método del Controller
const router = Router();

// Datos simulados: se devuelven pero NO se guardan
router.get("/users", getMockUsers);
router.get("/couriers", getMockCouriers);
router.get("/orders", getMockOrders);
router.get("/deliveries", getMockDeliveries);

// Carga de datos de prueba: SÍ se guardan en MongoDB
router.post("/seed", seedMocks);

export default router;
