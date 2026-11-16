import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/index.js";

// Esta ruta solo publica la documentación. Todo el contenido (info, schemas, endpoints)
// está en src/docs/, separado de las rutas de la API.
const router = Router();

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "ShipNow API - Documentación" }));

export default router;
