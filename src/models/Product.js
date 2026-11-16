import mongoose from "mongoose";
import { PRODUCT_STATUS, PRODUCT_STATUS_VALUES } from "../constants/index.js";

// El modelo SOLO define cómo se ve un producto en la base de datos.
// Las reglas de negocio viven en el service.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: PRODUCT_STATUS_VALUES,
      default: PRODUCT_STATUS.AVAILABLE
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
