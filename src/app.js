import express from "express";
import productsRouter from "./routes/products.router.js";
import usersRouter from "./routes/users.router.js";
import ordersRouter from "./routes/orders.router.js";
import deliveriesRouter from "./routes/deliveries.router.js";
import mocksRouter from "./routes/mocks.router.js";
import loggerRouter from "./routes/logger.router.js";
import docsRouter from "./routes/docs.router.js";
import { httpLogger } from "./middlewares/http.middleware.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Registra cada petición HTTP (nivel "http" del logger). Va primero para ver todas.
app.use(httpLogger);

// Permite leer el body de las peticiones en formato JSON
app.use(express.json());

// Rutas de la API
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/deliveries", deliveriesRouter);
app.use("/api/mocks", mocksRouter);
app.use("/api/logger", loggerRouter);

// Documentación interactiva (Swagger UI)
app.use("/api/docs", docsRouter);

// Ruta inexistente y errores: siempre al final
app.use(notFoundHandler);
app.use(errorHandler);

// app.js solo configura Express. El servidor se levanta en server.js
export default app;
