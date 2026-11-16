import mongoose from "mongoose";
import { DELIVERY_STATUS, DELIVERY_STATUS_VALUES } from "../constants/index.js";
import fileMetadataSchema from "./FileMetadata.js";

// El modelo SOLO define cómo se ve una entrega en la base de datos.
const deliverySchema = new mongoose.Schema(
  {
    // Cada pedido tiene como máximo una entrega
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    // Repartidor (un User con rol courier). Es null mientras la entrega está pendiente
    courier: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: DELIVERY_STATUS_VALUES,
      default: DELIVERY_STATUS.PENDING
    },
    scheduledDate: { type: Date, required: true },
    // Metadatos de los comprobantes de entrega subidos. Los archivos están en uploads/receipts/
    receipts: { type: [fileMetadataSchema], default: [] }
  },
  { timestamps: true }
);

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;
