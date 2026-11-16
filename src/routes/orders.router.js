import { Router } from "express";
import { getOrders, getOrderById, createOrder } from "../controllers/orders.controller.js";

// Las rutas solo conectan un path con el método del Controller
const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);

export default router;
