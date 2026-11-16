import { expect } from "chai";

const OBJECT_ID = /^[0-9a-f]{24}$/i;

export const expectValidId = (value) => {
  expect(value).to.be.a("string");
  expect(value).to.match(OBJECT_ID);
};

const expectValidDate = (value) => {
  expect(value).to.be.a("string");
  expect(Date.parse(value)).to.not.be.NaN;
};

// Respuesta exitosa con envoltorio: { status: "success", payload }
export const expectSuccessResponse = (res, statusCode) => {
  expect(res.status).to.equal(statusCode);
  expect(res.headers["content-type"]).to.match(/application\/json/);
  expect(res.body).to.have.all.keys("status", "payload");
  expect(res.body.status).to.equal("success");
};

// Respuesta de error con el formato del módulo de errores: { status, code, message, details }
// message puede ser un texto exacto o una RegExp.
export const expectErrorResponse = (res, { status, code, message }) => {
  expect(res.status).to.equal(status);
  expect(res.headers["content-type"]).to.match(/application\/json/);
  expect(res.body).to.have.all.keys("status", "code", "message", "details");
  expect(res.body.status).to.equal("error");
  expect(res.body.code).to.equal(code);
  expect(res.body.message).to.be.a("string");
  expect(res.body.details).to.be.an("array");
  if (message instanceof RegExp) {
    expect(res.body.message).to.match(message);
  } else if (message !== undefined) {
    expect(res.body.message).to.equal(message);
  }
};

// Los campos que fallaron, en una lista (los errores de validación los traen en `details`)
export const detailFields = (res) => res.body.details.map((detail) => detail.field);

export const expectUserShape = (user) => {
  expect(user).to.include.keys("_id", "first_name", "last_name", "email", "role", "createdAt", "updatedAt");
  expect(user).to.not.have.property("__v");
  expectValidId(user._id);
  expect(user.first_name).to.be.a("string");
  expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(user.role).to.be.oneOf(["admin", "user", "courier"]);
  expectValidDate(user.createdAt);
};

export const expectOrderShape = (order) => {
  expect(order).to.include.keys(
    "_id", "user", "items", "originAddress", "destinationAddress", "status", "priority", "createdAt", "updatedAt"
  );
  expect(order).to.not.have.property("__v");
  expectValidId(order._id);
  expectValidId(order.user);
  expect(order.items).to.be.an("array").that.is.not.empty;
  order.items.forEach((item) => {
    expect(item).to.have.all.keys("description", "quantity", "weight");
    expect(item.description).to.be.a("string");
    expect(item.quantity).to.be.a("number");
    expect(item.weight).to.be.a("number");
  });
  expect(order.status).to.be.oneOf(["pending", "in_transit", "delivered", "cancelled"]);
  expect(order.priority).to.be.oneOf(["low", "medium", "high"]);
  expectValidDate(order.createdAt);
};
