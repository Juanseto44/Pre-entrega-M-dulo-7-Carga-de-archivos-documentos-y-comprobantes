import { Router } from "express";
import { testLogger } from "../controllers/logger.controller.js";

// Las rutas solo conectan un path con el método del Controller
const router = Router();

// Endpoint interno de prueba: genera un log de cada nivel
router.get("/test", testLogger);

export default router;
