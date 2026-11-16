import { api } from "./helpers/request.js";
import { expectErrorResponse } from "./helpers/assertions.js";

describe("Rutas inexistentes", () => {
  it("404: GET a una ruta que no existe responde ROUTE_NOT_FOUND", async () => {
    const res = await api().get("/api/inexistente");

    expectErrorResponse(res, {
      status: 404,
      code: "ROUTE_NOT_FOUND",
      message: "No se encontró la ruta GET /api/inexistente"
    });
  });

  it("404: usa el método de la petición en el mensaje (POST)", async () => {
    const res = await api().post("/api/pedidos").send({});

    expectErrorResponse(res, {
      status: 404,
      code: "ROUTE_NOT_FOUND",
      message: "No se encontró la ruta POST /api/pedidos"
    });
  });

  it("404: una subruta que no existe dentro de un recurso también responde ROUTE_NOT_FOUND", async () => {
    const res = await api().get("/api/orders/abc/items");

    expectErrorResponse(res, { status: 404, code: "ROUTE_NOT_FOUND" });
  });
});
