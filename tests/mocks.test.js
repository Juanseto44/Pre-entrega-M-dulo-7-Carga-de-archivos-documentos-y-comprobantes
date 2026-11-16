import { expect } from "chai";
import User from "../src/models/User.js";
import Order from "../src/models/Order.js";
import Delivery from "../src/models/Delivery.js";
import { api } from "./helpers/request.js";
import { clearDatabase } from "./helpers/database.js";
import { createOrder, createUser } from "./helpers/fixtures.js";
import { expectErrorResponse, expectValidId } from "./helpers/assertions.js";

const MOCK_ENDPOINTS = ["users", "couriers", "orders", "deliveries"];

describe("Mocks — /api/mocks", () => {
  beforeEach(clearDatabase);

  describe("GET /api/mocks/* (datos simulados, no se guardan)", () => {
    it("200: /users genera la cantidad pedida de usuarios con emails únicos", async () => {
      const res = await api().get("/api/mocks/users").query({ qty: 5 });

      expect(res.status).to.equal(200);
      expect(res.headers["content-type"]).to.match(/application\/json/);
      // Los mocks responden directamente con un array (sin status ni payload)
      expect(res.body).to.be.an("array").with.lengthOf(5);
      res.body.forEach((user) => {
        expect(user).to.have.all.keys("first_name", "last_name", "email", "role");
        expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(user.role).to.be.oneOf(["admin", "user", "courier"]);
      });
      expect(new Set(res.body.map((user) => user.email)).size).to.equal(5);
    });

    it("200: sin qty genera 10 por defecto", async () => {
      const res = await api().get("/api/mocks/users");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(10);
    });

    it("200: /couriers genera usuarios con rol courier", async () => {
      const res = await api().get("/api/mocks/couriers").query({ qty: 3 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(3);
      res.body.forEach((courier) => expect(courier.role).to.equal("courier"));
    });

    it("200: /orders genera pedidos con items, direcciones, estado y prioridad válidos", async () => {
      const res = await api().get("/api/mocks/orders").query({ qty: 4 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(4);
      res.body.forEach((order) => {
        expect(order).to.have.all.keys("user", "items", "originAddress", "destinationAddress", "status", "priority");
        expectValidId(order.user);
        expect(order.items).to.be.an("array").that.is.not.empty;
        order.items.forEach((item) => {
          expect(item.description).to.be.a("string");
          expect(item.quantity).to.be.a("number");
          expect(item.weight).to.be.a("number");
        });
        expect(order.status).to.be.oneOf(["pending", "in_transit", "delivered", "cancelled"]);
        expect(order.priority).to.be.oneOf(["low", "medium", "high"]);
      });
    });

    it("200: /deliveries genera entregas coherentes (solo las pendientes no tienen repartidor)", async () => {
      const res = await api().get("/api/mocks/deliveries").query({ qty: 6 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(6);
      res.body.forEach((delivery) => {
        expect(delivery).to.have.all.keys("order", "courier", "status", "scheduledDate");
        expectValidId(delivery.order);
        expect(delivery.status).to.be.oneOf(["pending", "in_transit", "delivered"]);
        expect(Date.parse(delivery.scheduledDate)).to.not.be.NaN;
        if (delivery.status === "pending") {
          expect(delivery.courier).to.equal(null);
        } else {
          expectValidId(delivery.courier);
        }
      });
    });

    it("200: los datos simulados NO se guardan en la base", async () => {
      await api().get("/api/mocks/users").query({ qty: 3 });

      const res = await api().get("/api/users");
      expect(res.body.payload).to.deep.equal([]);
      expect(await User.countDocuments()).to.equal(0);
    });

    MOCK_ENDPOINTS.forEach((endpoint) => {
      it(`400: /${endpoint} rechaza qty=0 con INVALID_QUANTITY`, async () => {
        const res = await api().get(`/api/mocks/${endpoint}`).query({ qty: 0 });

        expectErrorResponse(res, {
          status: 400,
          code: "INVALID_QUANTITY",
          message: "qty debe ser un número entero entre 1 y 100"
        });
      });
    });

    // Cantidades inválidas: cada una con el código de error que le corresponde
    [
      { qty: "101", code: "INVALID_QUANTITY", message: "qty debe ser un número entero entre 1 y 100" },
      { qty: "abc", code: "INVALID_QUANTITY", message: "qty debe ser un número entero entre 1 y 100" },
      { qty: "2.5", code: "INVALID_QUANTITY", message: "qty debe ser un número entero entre 1 y 100" },
      { qty: "-5", code: "NEGATIVE_QUANTITY", message: "La cantidad (qty) no puede ser negativa" }
    ].forEach(({ qty, code, message }) => {
      it(`400: /users rechaza qty=${qty} con ${code}`, async () => {
        const res = await api().get("/api/mocks/users").query({ qty });

        expectErrorResponse(res, { status: 400, code, message });
      });
    });
  });

  describe("POST /api/mocks/seed (carga de datos de prueba, SÍ se guardan)", () => {
    it("201: type=users guarda los usuarios y responde cuántos insertó", async () => {
      const res = await api().post("/api/mocks/seed").query({ type: "users", qty: 3 });

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.equal({ insertados: 3, coleccion: "users" });
      expect(await User.countDocuments()).to.equal(3);
    });

    it("201: type=orders guarda pedidos asignados a un usuario existente con rol user", async () => {
      const customer = await createUser({ role: "user" });

      const res = await api().post("/api/mocks/seed").query({ type: "orders", qty: 4 });

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.equal({ insertados: 4, coleccion: "orders" });
      const orders = await Order.find().lean();
      expect(orders).to.have.lengthOf(4);
      orders.forEach((order) => expect(String(order.user)).to.equal(customer._id));
    });

    it("201: type=deliveries crea entregas sobre pedidos existentes que no tienen una", async () => {
      const customer = await createUser();
      await createOrder(customer._id); // los pedidos creados arrancan en pending
      await createOrder(customer._id);

      const res = await api().post("/api/mocks/seed").query({ type: "deliveries", qty: 2 });

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.equal({ insertados: 2, coleccion: "deliveries" });
      const deliveries = await Delivery.find().lean();
      expect(deliveries).to.have.lengthOf(2);
      deliveries.forEach((delivery) => {
        expect(delivery.status).to.equal("pending");
        expect(delivery.courier).to.equal(null);
      });
    });

    it("400: INVALID_MOCK_TYPE si el type no existe", async () => {
      const res = await api().post("/api/mocks/seed").query({ type: "products", qty: 2 });

      expectErrorResponse(res, {
        status: 400,
        code: "INVALID_MOCK_TYPE",
        message: "type debe ser uno de: users, couriers, orders, deliveries"
      });
    });

    it("400: INVALID_QUANTITY si qty es inválida y no guarda nada", async () => {
      const res = await api().post("/api/mocks/seed").query({ type: "users", qty: 0 });

      expectErrorResponse(res, { status: 400, code: "INVALID_QUANTITY" });
      expect(await User.countDocuments()).to.equal(0);
    });

    it("409: MOCK_PREREQUISITE_MISSING si se piden pedidos sin usuarios cargados", async () => {
      const res = await api().post("/api/mocks/seed").query({ type: "orders", qty: 2 });

      expectErrorResponse(res, {
        status: 409,
        code: "MOCK_PREREQUISITE_MISSING",
        message: /No hay usuarios con rol "user"/
      });
      expect(await Order.countDocuments()).to.equal(0);
    });
  });
});
