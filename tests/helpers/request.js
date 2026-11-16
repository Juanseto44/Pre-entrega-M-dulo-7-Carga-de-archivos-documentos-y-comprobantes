import request from "supertest";
import app from "../../src/app.js";

// Supertest recibe la app de Express (sin server.listen): levanta un servidor temporal
// en un puerto libre para cada petición, así que no hay que abrir ningún puerto a mano.
export const api = () => request(app);
