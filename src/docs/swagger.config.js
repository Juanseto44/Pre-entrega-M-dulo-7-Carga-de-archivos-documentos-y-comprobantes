import { config } from "../config/env.config.js";

// Información general de la documentación: nombre, versión, descripción, servidor y tags.

export const API_VERSION = "1.0.0";

// Si la configuración fuera inválida, server.js detiene el arranque antes de publicar la documentación
const LOCAL_PORT = config?.port ?? 8080;

export const openApiBase = {
  openapi: "3.0.3",
  info: {
    title: "ShipNow API",
    version: API_VERSION,
    description: [
      "API REST de **ShipNow** para gestionar usuarios (clientes, repartidores y administradores), productos, pedidos y entregas.",
      "",
      "**Propósito:** servir de base del proyecto de ShipNow, con arquitectura por capas, manejo centralizado de errores, logging y datos de prueba.",
      "",
      "- Las respuestas exitosas tienen la forma `{ \"status\": \"success\", \"payload\": ... }` (los endpoints de **Mocks** responden directamente con los datos).",
      "- Todos los errores tienen la forma `{ \"status\": \"error\", \"code\", \"message\", \"details\" }`.",
      "- La API **no tiene autenticación**: no hay respuestas 401 ni 403.",
      "- Los endpoints de **Mocks** y **Logger** son herramientas internas de prueba, no funcionalidades de negocio."
    ].join("\n")
  },
  servers: [{ url: `http://localhost:${LOCAL_PORT}`, description: "Servidor local" }],
  tags: [
    { name: "Users", description: "Gestión de usuarios y carga de sus documentos (DNI, licencia...). El rol `user` es cliente, `courier` es repartidor y `admin` es administrador." },
    { name: "Products", description: "Gestión de productos. El estado se calcula según el stock." },
    { name: "Orders", description: "Consulta y creación de pedidos. Cada pedido pertenece a un usuario y tiene uno o más items." },
    { name: "Deliveries", description: "Consulta de entregas y carga de comprobantes. Cada entrega pertenece a un pedido y, cuando salió, tiene un repartidor." },
    { name: "Mocks", description: "Herramienta de prueba: datos simulados (no se guardan) y carga de datos de prueba en MongoDB." },
    { name: "Logger", description: "Herramienta interna para validar el sistema de logs. NO es una funcionalidad de negocio." }
  ]
};
