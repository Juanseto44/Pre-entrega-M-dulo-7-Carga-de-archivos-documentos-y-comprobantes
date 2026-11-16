import { Router } from "express";
import { getDeliveries, getDeliveryById, addDeliveryReceipt } from "../controllers/deliveries.controller.js";
import { uploadSingleFile } from "../middlewares/upload.middleware.js";
import { UPLOAD_FOLDERS } from "../constants/index.js";

// Las rutas solo conectan un path con el método del Controller
const router = Router();

router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
// uploadSingleFile recibe y guarda el archivo antes de llegar al controller
router.post("/:id/receipts", uploadSingleFile(UPLOAD_FOLDERS.RECEIPTS), addDeliveryReceipt);

export default router;
