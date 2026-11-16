import mongoose from "mongoose";
import { USER_ROLES, USER_ROLE_VALUES } from "../constants/index.js";
import fileMetadataSchema from "./FileMetadata.js";

// El modelo SOLO define cómo se ve un usuario en la base de datos.
const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.USER
    },
    // Metadatos de los documentos subidos (DNI, licencia...). Los archivos están en uploads/documents/
    documents: { type: [fileMetadataSchema], default: [] }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
