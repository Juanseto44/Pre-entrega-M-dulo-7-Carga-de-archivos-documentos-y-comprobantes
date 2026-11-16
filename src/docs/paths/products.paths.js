import { ERROR_CODES } from "../../errors/index.js";
import { errorExample, errorResponse, successResponse, jsonBody, idParameter, schemaRef, responseRef } from "../helpers.js";
import { invalidIdExample, invalidJsonExample, noFieldsToUpdateExample } from "../examples.js";

const TAG = "Products";

const validationExample = errorExample(ERROR_CODES.VALIDATION_ERROR, "Los datos del producto no son válidos", {
  details: [
    { field: "price", message: "El precio debe ser un número mayor o igual a 0" },
    { field: "stock", message: "El stock debe ser un número entero mayor o igual a 0" }
  ]
});

export const productsPaths = {
  "/api/products": {
    get: {
      tags: [TAG],
      summary: "Listar productos con stock",
      description:
        "Devuelve solo los productos **disponibles** (con stock), los más nuevos primero. Un producto sin stock no aparece acá, pero sí se puede consultar por id.",
      operationId: "getProducts",
      responses: {
        200: successResponse("Lista de productos disponibles", { type: "array", items: schemaRef("Product") }),
        500: responseRef("InternalError")
      }
    },
    post: {
      tags: [TAG],
      summary: "Crear un producto",
      description:
        "`name`, `price` y `stock` son obligatorios. El estado no se envía: queda `available` si hay stock y `out_of_stock` si el stock es 0.",
      operationId: "createProduct",
      requestBody: jsonBody("ProductInput", {
        name: "Caja chica",
        description: "Caja de cartón 20x20",
        price: 1500,
        stock: 10
      }),
      responses: {
        201: successResponse("Producto creado", schemaRef("Product")),
        400: errorResponse(
          "Datos inválidos (`details` indica cada campo) o body que no es un JSON válido",
          validationExample,
          invalidJsonExample
        ),
        500: responseRef("InternalError")
      }
    }
  },

  "/api/products/{id}": {
    get: {
      tags: [TAG],
      summary: "Obtener un producto por id",
      description: "Devuelve el producto aunque no tenga stock.",
      operationId: "getProductById",
      parameters: [idParameter("producto")],
      responses: {
        200: successResponse("El producto", schemaRef("Product")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("producto")),
        404: responseRef("ProductNotFound"),
        500: responseRef("InternalError")
      }
    },
    put: {
      tags: [TAG],
      summary: "Editar un producto",
      description: "Modifica solo los campos enviados (al menos uno). Si se envía `stock`, el estado se recalcula.",
      operationId: "updateProduct",
      parameters: [idParameter("producto")],
      requestBody: jsonBody("ProductUpdateInput", { price: 2200, stock: 0 }),
      responses: {
        200: successResponse("El producto ya actualizado", schemaRef("Product")),
        400: errorResponse(
          "Id inválido, datos inválidos, body sin campos o body que no es un JSON válido",
          invalidIdExample("producto"),
          validationExample,
          noFieldsToUpdateExample(["name", "description", "price", "stock"]),
          invalidJsonExample
        ),
        404: responseRef("ProductNotFound"),
        500: responseRef("InternalError")
      }
    },
    delete: {
      tags: [TAG],
      summary: "Eliminar un producto",
      description: "Elimina el producto y devuelve los datos del producto eliminado.",
      operationId: "deleteProduct",
      parameters: [idParameter("producto")],
      responses: {
        200: successResponse("El producto eliminado", schemaRef("Product")),
        400: errorResponse("El id no tiene formato de MongoDB", invalidIdExample("producto")),
        404: responseRef("ProductNotFound"),
        500: responseRef("InternalError")
      }
    }
  }
};
