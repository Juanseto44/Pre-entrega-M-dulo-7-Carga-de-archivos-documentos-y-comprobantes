import { expect } from "chai";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { api } from "./helpers/request.js";
import { clearDatabase } from "./helpers/database.js";
import { buildUserData, createUser } from "./helpers/fixtures.js";
import { expectSuccessResponse, expectErrorResponse, expectUserShape, detailFields } from "./helpers/assertions.js";

describe("Usuarios — /api/users", () => {
  // Limpieza ANTES de cada test: cada uno parte de una base vacía (no depende del orden)
  beforeEach(clearDatabase);

  describe("GET /api/users", () => {
    it("200: devuelve una lista vacía si no hay usuarios", async () => {
      const res = await api().get("/api/users");

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.deep.equal([]);
    });

    it("200: devuelve los usuarios existentes con su estructura", async () => {
      const ana = await createUser({ first_name: "Ana" });
      const luis = await createUser({ first_name: "Luis", role: "courier" });

      const res = await api().get("/api/users");

      expectSuccessResponse(res, 200);
      expect(res.body.payload).to.be.an("array").with.lengthOf(2);
      res.body.payload.forEach((user) => expectUserShape(user));
      expect(res.body.payload.map((user) => user.email)).to.have.members([ana.email, luis.email]);
    });
  });

  describe("GET /api/users/:id", () => {
    it("200: devuelve el usuario pedido", async () => {
      const user = await createUser();

      const res = await api().get(`/api/users/${user._id}`);

      expectSuccessResponse(res, 200);
      expectUserShape(res.body.payload);
      expect(res.body.payload._id).to.equal(user._id);
      expect(res.body.payload.email).to.equal(user.email);
    });

    it("404: USER_NOT_FOUND si el usuario no existe", async () => {
      const res = await api().get(`/api/users/${new mongoose.Types.ObjectId()}`);

      expectErrorResponse(res, { status: 404, code: "USER_NOT_FOUND", message: "Usuario no encontrado" });
    });

    it("400: INVALID_ID si el id no tiene formato de MongoDB", async () => {
      const res = await api().get("/api/users/123");

      expectErrorResponse(res, { status: 400, code: "INVALID_ID", message: "El id del usuario no es válido" });
    });
  });

  describe("POST /api/users", () => {
    it("201: crea un usuario con datos válidos y lo guarda", async () => {
      const data = buildUserData({ first_name: "Marta", role: "courier" });

      const res = await api().post("/api/users").send(data);

      expectSuccessResponse(res, 201);
      expectUserShape(res.body.payload);
      expect(res.body.payload).to.include({
        first_name: "Marta",
        last_name: data.last_name,
        email: data.email,
        role: "courier"
      });
      expect(await User.countDocuments()).to.equal(1);
    });

    it("201: usa el rol 'user' por defecto y guarda el email en minúsculas", async () => {
      const { role, ...dataWithoutRole } = buildUserData({ email: "MAYUS.Test@Test.com" });

      const res = await api().post("/api/users").send(dataWithoutRole);

      expectSuccessResponse(res, 201);
      expect(res.body.payload.role).to.equal("user");
      expect(res.body.payload.email).to.equal("mayus.test@test.com");
    });

    it("400: VALIDATION_ERROR si faltan datos obligatorios (details indica cada campo)", async () => {
      const res = await api().post("/api/users").send({ first_name: "Ana" });

      expectErrorResponse(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Los datos del usuario no son válidos"
      });
      expect(detailFields(res)).to.have.members(["last_name", "email"]);
      expect(await User.countDocuments()).to.equal(0);
    });

    it("400: INVALID_JSON si el body no es un JSON válido", async () => {
      const res = await api().post("/api/users").set("Content-Type", "application/json").send("{ esto no es json");

      expectErrorResponse(res, { status: 400, code: "INVALID_JSON", message: "El body no es un JSON válido" });
    });

    it("409: EMAIL_ALREADY_REGISTERED si el email ya existe", async () => {
      const existing = await createUser();

      const res = await api().post("/api/users").send(buildUserData({ email: existing.email }));

      expectErrorResponse(res, { status: 409, code: "EMAIL_ALREADY_REGISTERED", message: "El email ya está registrado" });
      expect(await User.countDocuments()).to.equal(1);
    });
  });
});
