import { expect } from "chai";
import { api } from "./helpers/request.js";
import { expectSuccessResponse, expectErrorResponse } from "./helpers/assertions.js";

describe("Logger — /api/logger", () => {
  describe("GET /api/logger/test", () => {
    it("200: responde el entorno, el nivel activo y qué niveles se registran", async () => {
      const res = await api().get("/api/logger/test");

      expectSuccessResponse(res, 200);
      const { environment, activeLevel, levels } = res.body.payload;
      // Confirma que los tests corren con NODE_ENV=test (entorno separado del de desarrollo)
      expect(environment).to.equal("test");
      expect(activeLevel).to.equal("warning");
      expect(levels).to.deep.equal({
        debug: false,
        http: false,
        info: false,
        warning: true,
        error: true,
        fatal: true
      });
    });
  });

  it("404: ROUTE_NOT_FOUND si se usa un método que la ruta no tiene (POST)", async () => {
    const res = await api().post("/api/logger/test");

    expectErrorResponse(res, {
      status: 404,
      code: "ROUTE_NOT_FOUND",
      message: "No se encontró la ruta POST /api/logger/test"
    });
  });
});
