import { expect } from "chai";
import mongoose from "mongoose";
import Order from "../src/models/Order.js";
import { api } from "./helpers/request.js";
import { clearDatabase } from "./helpers/database.js";
import { buildOrderData, createOrder, createUser } from "./helpers/fixtures.js";
import {
  expectSuccessResponse,
  expectErrorResponse,
  expectOrderShape,
  expectValidId,
  detailFields
} from "./helpers/assertions.js";

describe("Pedidos — /api/orders", () => {
  // Limpieza ANTES de cada test: cada uno crea sus propios datos (usuario + pedidos)
  beforeEach(clearDatabase);

  describe("GET /api/orders", () => {
    it("200: devuelve una lista vacía si no hay pedidos", async () => {
      const res = await api().get("/api/orders");

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.deep.equal([]);
    });

    it("200: devuelve los pedidos con su estructura", async () => {
      const user = await createUser();
      const first = await createOrder(user._id, { priority: "high" });
      const second = await createOrder(user._id);

      const res = await api().get("/api/orders");

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.be.an("array").with.lengthOf(2);
      res.body.payload.forEach((order) => {
        expectOrderShape(order);
        expect(order.user).to.equal(user._id);
      });
      expect(res.body.payload.map((order) => order._id)).to.have.members([first._id, second._id]);
    });

    it("200: ?status= devuelve solo los pedidos de ese estado", async () => {
      const user = await createUser();
      const pending = await createOrder(user._id);
      await createOrder(user._id, { status: "delivered" });

      const res = await api().get("/api/orders").query({ status: "pending" });

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.have.lengthOf(1);
      expect(res.body.payload[0]._id).to.equal(pending._id);
      expect(res.body.payload[0].status).to.equal("pending");
    });

    it("200: ?status= sin pedidos de ese estado devuelve una lista vacía", async () => {
      const user = await createUser();
      await createOrder(user._id);

      const res = await api().get("/api/orders").query({ status: "cancelled" });

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.deep.equal([]);
    });

    it("400: INVALID_STATUS si el estado del filtro no existe", async () => {
      const res = await api().get("/api/orders").query({ status: "shipped" });

      expectErrorResponse(res, {
        status: 400,
        code: "INVALID_STATUS",
        message: 'El estado "shipped" no es válido. Valores permitidos: pending, in_transit, delivered, cancelled'
      });
    });
  });

  describe("GET /api/orders/:id", () => {
    it("200: devuelve el pedido pedido", async () => {
      const user = await createUser();
      const order = await createOrder(user._id, { priority: "low" });

      const res = await api().get(`/api/orders/${order._id}`);

      expectSuccessResponse(res, 200);
      expectOrderShape(res.body.payload);
      expect(res.body.payload._id).to.equal(order._id);
      expect(res.body.payload.user).to.equal(user._id);
      expect(res.body.payload.priority).to.equal("low");
      expect(res.body.payload.items).to.deep.equal(order.items);
    });

    it("404: ORDER_NOT_FOUND si el pedido no existe", async () => {
      const res = await api().get(`/api/orders/${new mongoose.Types.ObjectId()}`);

      expectErrorResponse(res, { status: 404, code: "ORDER_NOT_FOUND", message: "Pedido no encontrado" });
    });

    it("400: INVALID_ID si el id no tiene formato de MongoDB", async () => {
      const res = await api().get("/api/orders/abc");

      expectErrorResponse(res, { status: 400, code: "INVALID_ID", message: "El id del pedido no es válido" });
    });
  });

  describe("POST /api/orders", () => {
    it("201: crea un pedido con datos válidos, en estado pending y prioridad medium por defecto", async () => {
      const user = await createUser();
      const data = buildOrderData(user._id);

      const res = await api().post("/api/orders").send(data);

      expectSuccessResponse(res, 201);
      expectOrderShape(res.body.payload);
      expect(res.body.payload.user).to.equal(user._id);
      expect(res.body.payload.items).to.deep.equal(data.items);
      expect(res.body.payload.originAddress).to.equal(data.originAddress);
      expect(res.body.payload.destinationAddress).to.equal(data.destinationAddress);
      expect(res.body.payload.status).to.equal("pending");
      expect(res.body.payload.priority).to.equal("medium");
      expect(await Order.countDocuments()).to.equal(1);
    });

    it("201: el pedido creado se puede consultar por su id", async () => {
      const user = await createUser();

      const created = await api().post("/api/orders").send(buildOrderData(user._id, { priority: "high" }));
      expectValidId(created.body.payload._id);

      const res = await api().get(`/api/orders/${created.body.payload._id}`);

      expectSuccessResponse(res, 200);
      expect(res.body.payload._id).to.equal(created.body.payload._id);
      expect(res.body.payload.priority).to.equal("high");
    });

    it("201: ignora el estado enviado: un pedido nuevo siempre empieza en pending", async () => {
      const user = await createUser();

      const res = await api().post("/api/orders").send(buildOrderData(user._id, { status: "delivered" }));

      expectSuccessResponse(res, 201);
      expect(res.body.payload.status).to.equal("pending");
    });

    it("400: VALIDATION_ERROR si faltan datos obligatorios (details indica cada campo)", async () => {
      const res = await api().post("/api/orders").send({});

      expectErrorResponse(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Los datos del pedido no son válidos"
      });
      expect(detailFields(res)).to.have.members(["user", "items", "originAddress", "destinationAddress"]);
      expect(await Order.countDocuments()).to.equal(0);
    });

    it("400: VALIDATION_ERROR si un item tiene datos inválidos", async () => {
      const user = await createUser();
      const items = [{ description: "", quantity: 0, weight: -1 }];

      const res = await api().post("/api/orders").send(buildOrderData(user._id, { items }));

      expectErrorResponse(res, { status: 400, code: "VALIDATION_ERROR" });
      expect(detailFields(res)).to.have.members(["items[0].description", "items[0].quantity", "items[0].weight"]);
    });

    it("400: VALIDATION_ERROR si la prioridad no existe", async () => {
      const user = await createUser();

      const res = await api().post("/api/orders").send(buildOrderData(user._id, { priority: "urgent" }));

      expectErrorResponse(res, { status: 400, code: "VALIDATION_ERROR" });
      expect(detailFields(res)).to.deep.equal(["priority"]);
    });

    it("400: VALIDATION_ERROR si el id de usuario no tiene formato válido", async () => {
      const res = await api().post("/api/orders").send(buildOrderData("123"));

      expectErrorResponse(res, { status: 400, code: "VALIDATION_ERROR" });
      expect(detailFields(res)).to.deep.equal(["user"]);
    });

    it("400: INVALID_JSON si el body no es un JSON válido", async () => {
      const res = await api().post("/api/orders").set("Content-Type", "application/json").send("{ roto");

      expectErrorResponse(res, { status: 400, code: "INVALID_JSON", message: "El body no es un JSON válido" });
    });

    it("404: USER_NOT_FOUND si el usuario del pedido no existe", async () => {
      const res = await api().post("/api/orders").send(buildOrderData(String(new mongoose.Types.ObjectId())));

      expectErrorResponse(res, { status: 404, code: "USER_NOT_FOUND", message: "Usuario no encontrado" });
      expect(await Order.countDocuments()).to.equal(0);
    });
  });
});
