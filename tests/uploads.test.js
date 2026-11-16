import { expect } from "chai";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Delivery from "../src/models/Delivery.js";
import { api } from "./helpers/request.js";
import { clearDatabase } from "./helpers/database.js";
import { clearUploads, listUploadedFiles, readStoredFile } from "./helpers/uploads.js";
import { createUser, createDelivery, PDF_FILE, PNG_FILE, TEXT_FILE } from "./helpers/fixtures.js";
import { expectSuccessResponse, expectErrorResponse, expectUserShape } from "./helpers/assertions.js";

const MAX_SIZE = 5 * 1024 * 1024;
const FILE_FIELD_MESSAGE = 'Falta el archivo. Enviá un archivo en el campo "file" (multipart/form-data)';

// Un id válido que no existe en la base
const unknownId = () => String(new mongoose.Types.ObjectId());

// Sube un archivo al endpoint indicado (campo "file")
const upload = (url, buffer, { filename, contentType, field = "file", fields = {} }) => {
  let request = api().post(url);
  Object.entries(fields).forEach(([name, value]) => {
    request = request.field(name, value);
  });
  return request.attach(field, buffer, { filename, contentType });
};

// Comprueba que los metadatos tengan todos los campos pedidos por la consigna
const expectMetadata = (metadata, expected) => {
  expect(metadata).to.have.all.keys(
    "_id", "originalName", "fileName", "path", "mimeType", "size", "documentType", "uploadedAt"
  );
  expect(metadata.originalName).to.equal(expected.originalName);
  expect(metadata.mimeType).to.equal(expected.mimeType);
  expect(metadata.size).to.equal(expected.size);
  expect(metadata.documentType).to.equal(expected.documentType);
  // El nombre guardado lo genera el servidor: no es el original
  expect(metadata.fileName).to.match(new RegExp(`^\\d+-[0-9a-f-]{36}\\${expected.extension}$`));
  expect(metadata.fileName).to.not.equal(metadata.originalName);
  expect(metadata.path).to.equal(`uploads-test/${expected.folder}/${metadata.fileName}`);
  expect(Date.parse(metadata.uploadedAt)).to.not.be.NaN;
};

describe("Archivos — carga de documentos y comprobantes", () => {
  // Limpieza ANTES de cada test: base vacía y carpeta de uploads de testing vacía
  beforeEach(async () => {
    await clearDatabase();
    await clearUploads();
  });

  describe("POST /api/users/:id/documents", () => {
    it("201: sube un documento, lo guarda en el disco y registra sus metadatos en el usuario", async () => {
      const user = await createUser();

      const res = await upload(`/api/users/${user._id}/documents`, PDF_FILE, {
        filename: "dni-frente.pdf",
        contentType: "application/pdf",
        fields: { documentType: "dni" }
      });

      expectSuccessResponse(res, 201);
      expectUserShape(res.body.payload);
      expect(res.body.payload._id).to.equal(user._id);
      expect(res.body.payload.documents).to.have.lengthOf(1);

      const [metadata] = res.body.payload.documents;
      expectMetadata(metadata, {
        originalName: "dni-frente.pdf",
        mimeType: "application/pdf",
        size: PDF_FILE.length,
        documentType: "dni",
        extension: ".pdf",
        folder: "documents"
      });

      // El archivo quedó en el disco, con el mismo contenido que se envió
      expect(await readStoredFile(metadata.path)).to.deep.equal(PDF_FILE);
      // En la base están los metadatos (el archivo NO está en MongoDB)
      const saved = await User.findById(user._id).lean();
      expect(saved.documents).to.have.lengthOf(1);
      expect(saved.documents[0].fileName).to.equal(metadata.fileName);
      expect(saved.documents[0]).to.not.have.property("content");
    });

    it("201: si no se envía documentType se usa 'other' y acepta imágenes PNG", async () => {
      const user = await createUser();

      const res = await upload(`/api/users/${user._id}/documents`, PNG_FILE, {
        filename: "foto.png",
        contentType: "image/png"
      });

      expectSuccessResponse(res, 201);
      expect(res.body.payload.documents[0].documentType).to.equal("other");
      expect(res.body.payload.documents[0].mimeType).to.equal("image/png");
      expect(res.body.payload.documents[0].fileName).to.match(/\.png$/);
    });

    it("201: un segundo documento se suma al primero", async () => {
      const user = await createUser();
      const url = `/api/users/${user._id}/documents`;

      await upload(url, PDF_FILE, { filename: "dni.pdf", contentType: "application/pdf", fields: { documentType: "dni" } });
      const res = await upload(url, PDF_FILE, {
        filename: "licencia.pdf",
        contentType: "application/pdf",
        fields: { documentType: "license" }
      });

      expectSuccessResponse(res, 201);
      expect(res.body.payload.documents.map((doc) => doc.documentType)).to.deep.equal(["dni", "license"]);
      expect(await listUploadedFiles()).to.have.lengthOf(2);
    });

    it("400: FILE_REQUIRED si no se envía el archivo", async () => {
      const user = await createUser();

      const res = await api().post(`/api/users/${user._id}/documents`).field("documentType", "dni");

      expectErrorResponse(res, { status: 400, code: "FILE_REQUIRED", message: FILE_FIELD_MESSAGE });
      expect((await User.findById(user._id).lean()).documents).to.have.lengthOf(0);
    });

    it("400: FILE_REQUIRED si la petición ni siquiera es multipart", async () => {
      const user = await createUser();

      const res = await api().post(`/api/users/${user._id}/documents`).send({ documentType: "dni" });

      expectErrorResponse(res, { status: 400, code: "FILE_REQUIRED" });
    });

    it("400: INVALID_DOCUMENT_TYPE si el tipo de documento no es válido y no deja el archivo en el disco", async () => {
      const user = await createUser();

      const res = await upload(`/api/users/${user._id}/documents`, PDF_FILE, {
        filename: "pasaporte.pdf",
        contentType: "application/pdf",
        fields: { documentType: "pasaporte" }
      });

      expectErrorResponse(res, {
        status: 400,
        code: "INVALID_DOCUMENT_TYPE",
        message: 'El tipo de documento "pasaporte" no es válido. Valores permitidos: dni, license, address_proof, other'
      });
      expect(await listUploadedFiles()).to.deep.equal([]);
      expect((await User.findById(user._id).lean()).documents).to.have.lengthOf(0);
    });

    it("400: INVALID_FILE_FIELD si el archivo se envía en un campo que no es 'file'", async () => {
      const user = await createUser();

      const res = await upload(`/api/users/${user._id}/documents`, PDF_FILE, {
        filename: "dni.pdf",
        contentType: "application/pdf",
        field: "document"
      });

      expectErrorResponse(res, {
        status: 400,
        code: "INVALID_FILE_FIELD",
        message: 'El archivo debe enviarse en el campo "file" (campo recibido: "document")'
      });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("400: INVALID_ID si el id del usuario no tiene formato válido y no deja el archivo en el disco", async () => {
      const res = await upload("/api/users/123/documents", PDF_FILE, {
        filename: "dni.pdf",
        contentType: "application/pdf"
      });

      expectErrorResponse(res, { status: 400, code: "INVALID_ID", message: "El id del usuario no es válido" });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("404: USER_NOT_FOUND si el usuario no existe y no deja el archivo en el disco", async () => {
      const res = await upload(`/api/users/${unknownId()}/documents`, PDF_FILE, {
        filename: "dni.pdf",
        contentType: "application/pdf",
        fields: { documentType: "dni" }
      });

      expectErrorResponse(res, { status: 404, code: "USER_NOT_FOUND", message: "Usuario no encontrado" });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("413: FILE_TOO_LARGE si el archivo supera el tamaño máximo (5 MB)", async () => {
      const user = await createUser();
      const bigFile = Buffer.alloc(MAX_SIZE + 1, "a");

      const res = await upload(`/api/users/${user._id}/documents`, bigFile, {
        filename: "enorme.pdf",
        contentType: "application/pdf"
      });

      expectErrorResponse(res, {
        status: 413,
        code: "FILE_TOO_LARGE",
        message: "El archivo supera el tamaño máximo permitido (5 MB)"
      });
      expect(await listUploadedFiles()).to.deep.equal([]);
      expect((await User.findById(user._id).lean()).documents).to.have.lengthOf(0);
    });

    it("415: INVALID_FILE_TYPE si el tipo de archivo no está permitido", async () => {
      const user = await createUser();

      const res = await upload(`/api/users/${user._id}/documents`, TEXT_FILE, {
        filename: "notas.txt",
        contentType: "text/plain"
      });

      expectErrorResponse(res, {
        status: 415,
        code: "INVALID_FILE_TYPE",
        message: 'El tipo de archivo "text/plain" no está permitido. Tipos permitidos: image/jpeg, image/png, application/pdf'
      });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });
  });

  describe("POST /api/deliveries/:id/receipts", () => {
    it("201: sube un comprobante, lo guarda en el disco y devuelve la entrega actualizada", async () => {
      const delivery = await createDelivery();

      const res = await upload(`/api/deliveries/${delivery._id}/receipts`, PNG_FILE, {
        filename: "entrega-firmada.png",
        contentType: "image/png"
      });

      expectSuccessResponse(res, 201);
      expect(res.body.payload).to.include.keys("_id", "order", "courier", "status", "scheduledDate", "receipts");
      expect(res.body.payload._id).to.equal(delivery._id);
      expect(res.body.payload.receipts).to.have.lengthOf(1);

      const [metadata] = res.body.payload.receipts;
      expectMetadata(metadata, {
        originalName: "entrega-firmada.png",
        mimeType: "image/png",
        size: PNG_FILE.length,
        documentType: "delivery_receipt",
        extension: ".png",
        folder: "receipts"
      });
      expect(await readStoredFile(metadata.path)).to.deep.equal(PNG_FILE);
    });

    it("201: el comprobante queda asociado a la entrega y se ve al consultarla", async () => {
      const delivery = await createDelivery();
      await upload(`/api/deliveries/${delivery._id}/receipts`, PDF_FILE, {
        filename: "remito.pdf",
        contentType: "application/pdf"
      });

      const res = await api().get(`/api/deliveries/${delivery._id}`);

      expectSuccessResponse(res, 200);
      expect(res.body.payload.receipts).to.have.lengthOf(1);
      expect(res.body.payload.receipts[0].originalName).to.equal("remito.pdf");
      expect((await Delivery.findById(delivery._id).lean()).receipts).to.have.lengthOf(1);
    });

    it("400: FILE_REQUIRED si no se envía el archivo", async () => {
      const delivery = await createDelivery();

      const res = await api().post(`/api/deliveries/${delivery._id}/receipts`);

      expectErrorResponse(res, { status: 400, code: "FILE_REQUIRED", message: FILE_FIELD_MESSAGE });
    });

    it("404: DELIVERY_NOT_FOUND si la entrega no existe y no deja el archivo en el disco", async () => {
      const res = await upload(`/api/deliveries/${unknownId()}/receipts`, PDF_FILE, {
        filename: "remito.pdf",
        contentType: "application/pdf"
      });

      expectErrorResponse(res, { status: 404, code: "DELIVERY_NOT_FOUND", message: "Entrega no encontrada" });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("400: INVALID_ID si el id de la entrega no tiene formato válido y no deja el archivo en el disco", async () => {
      const res = await upload("/api/deliveries/abc/receipts", PDF_FILE, {
        filename: "remito.pdf",
        contentType: "application/pdf"
      });

      expectErrorResponse(res, { status: 400, code: "INVALID_ID", message: /no es válido/ });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("415: INVALID_FILE_TYPE si el tipo de archivo no está permitido", async () => {
      const delivery = await createDelivery();

      const res = await upload(`/api/deliveries/${delivery._id}/receipts`, TEXT_FILE, {
        filename: "notas.txt",
        contentType: "text/plain"
      });

      expectErrorResponse(res, { status: 415, code: "INVALID_FILE_TYPE" });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });

    it("413: FILE_TOO_LARGE si el comprobante supera el tamaño máximo", async () => {
      const delivery = await createDelivery();

      const res = await upload(`/api/deliveries/${delivery._id}/receipts`, Buffer.alloc(MAX_SIZE + 1, "a"), {
        filename: "enorme.pdf",
        contentType: "application/pdf"
      });

      expectErrorResponse(res, { status: 413, code: "FILE_TOO_LARGE" });
      expect(await listUploadedFiles()).to.deep.equal([]);
    });
  });
});
