import mongoose from "mongoose";
import {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  ORDER_PRIORITY,
  ORDER_PRIORITY_VALUES
} from "../constants/index.js";

// Cada item es un paquete o producto dentro del pedido.
// Va "embebido" (dentro del pedido): no tiene su propia colección ni su propio _id.
const orderItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0 } // peso de una unidad, en kilos
  },
  { _id: false }
);

// El modelo SOLO define cómo se ve un pedido en la base de datos.
const orderSchema = new mongoose.Schema(
  {
    // Referencia al cliente que hizo el pedido: se guarda solo su ObjectId
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "El pedido debe tener al menos un item"
      }
    },
    originAddress: { type: String, required: true, trim: true },
    destinationAddress: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUS.PENDING
    },
    priority: {
      type: String,
      enum: ORDER_PRIORITY_VALUES,
      default: ORDER_PRIORITY.MEDIUM
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
