import { expect } from "chai";
import { swaggerSpec } from "../src/docs/index.js";
import { api } from "./helpers/request.js";
import { expectErrorResponse } from "./helpers/assertions.js";

describe("Swagger — /api/docs", () => {
  describe("GET /api/docs", () => {
    it("200: publica la página HTML de Swagger UI", async () => {
      const res = await api().get("/api/docs/");

      expect(res.status).to.equal(200);
      expect(res.headers["content-type"]).to.match(/text\/html/);
      expect(res.text).to.include("swagger-ui");
    });

    it("404: una ruta fuera de la documentación sigue respondiendo con el formato de error", async () => {
      // Swagger no documenta respuestas de error propias: se comprueba que la app no las mezcla
      const res = await api().get("/api/doc");

      expectErrorResponse(res, { status: 404, code: "ROUTE_NOT_FOUND" });
    });
  });

  describe("Especificación OpenAPI", () => {
    it("tiene la información general y el servidor local", () => {
      expect(swaggerSpec.openapi).to.match(/^3\./);
      expect(swaggerSpec.info.title).to.equal("ShipNow API");
      expect(swaggerSpec.info.version).to.be.a("string");
      expect(swaggerSpec.servers).to.be.an("array").that.is.not.empty;
    });

    it("documenta cada tag principal", () => {
      const tags = swaggerSpec.tags.map((tag) => tag.name);
      expect(tags).to.include.members(["Users", "Orders", "Deliveries", "Mocks", "Logger"]);
    });
  });

  // Coherencia con Swagger: cada comportamiento que los tests verifican está documentado.
  // (El test que lo comprueba contra la API real está en el archivo del módulo indicado.)
  describe("Coherencia: los comportamientos probados están documentados", () => {
    const documented = [
      ["/api/users", "get", ["200"]], // users.test.js
      ["/api/users", "post", ["201", "400", "409"]], // users.test.js
      ["/api/users/{id}", "get", ["200", "400", "404"]], // users.test.js
      ["/api/orders", "get", ["200", "400"]], // orders.test.js (400: estado inválido)
      ["/api/orders", "post", ["201", "400", "404"]], // orders.test.js
      ["/api/orders/{id}", "get", ["200", "400", "404"]], // orders.test.js
      ["/api/mocks/users", "get", ["200", "400"]], // mocks.test.js
      ["/api/mocks/couriers", "get", ["200", "400"]], // mocks.test.js
      ["/api/mocks/orders", "get", ["200", "400"]], // mocks.test.js
      ["/api/mocks/deliveries", "get", ["200", "400"]], // mocks.test.js
      ["/api/mocks/seed", "post", ["201", "400", "409"]], // mocks.test.js
      ["/api/users/{id}/documents", "post", ["201", "400", "404", "413", "415"]], // uploads.test.js
      ["/api/deliveries/{id}/receipts", "post", ["201", "400", "404", "413", "415"]], // uploads.test.js
      ["/api/logger/test", "get", ["200"]] // logger.test.js
    ];

    it("los endpoints de archivos están documentados como multipart/form-data con el campo file", () => {
      const endpoints = [
        swaggerSpec.paths["/api/users/{id}/documents"].post,
        swaggerSpec.paths["/api/deliveries/{id}/receipts"].post
      ];
      endpoints.forEach((operation) => {
        const schema = operation.requestBody.content["multipart/form-data"].schema;
        expect(schema.required).to.include("file");
        expect(schema.properties.file.format).to.equal("binary");
      });
    });

    documented.forEach(([path, method, statuses]) => {
      it(`${method.toUpperCase()} ${path} documenta ${statuses.join(", ")}`, () => {
        const operation = swaggerSpec.paths[path]?.[method];
        expect(operation, `${method} ${path} no está documentado`).to.exist;
        expect(Object.keys(operation.responses)).to.include.members(statuses);
      });
    });
  });
});
