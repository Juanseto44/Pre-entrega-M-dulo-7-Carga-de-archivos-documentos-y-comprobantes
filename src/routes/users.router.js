import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  addUserDocument,
  updateUser,
  deleteUser
} from "../controllers/users.controller.js";
import { uploadSingleFile } from "../middlewares/upload.middleware.js";
import { UPLOAD_FOLDERS } from "../constants/index.js";

// Las rutas solo conectan un path con el método del Controller
const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
// uploadSingleFile recibe y guarda el archivo antes de llegar al controller
router.post("/:id/documents", uploadSingleFile(UPLOAD_FOLDERS.DOCUMENTS), addUserDocument);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
