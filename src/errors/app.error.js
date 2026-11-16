import { ERROR_DICTIONARY } from "./error.dictionary.js";

// Clase base de todos los errores "esperados" de la aplicación.
// Un error esperado es uno que sabemos que puede pasar (usuario inexistente, qty inválida, etc.).
// Los lanzan los services y los transforma en respuesta HTTP el middleware de errores.
//
//  - code: código del diccionario (ej: "USER_NOT_FOUND")
//  - message: si no se indica, se usa el mensaje por defecto del diccionario
//  - details: lista con el detalle (ej: qué campos fallaron)
//  - cause: el error original (ej: el de MongoDB). NO se envía al cliente, solo se imprime en el servidor.
export class AppError extends Error {
  constructor(code, message, { details = [], cause } = {}) {
    const definition = ERROR_DICTIONARY[code];
    super(message ?? definition.message, cause ? { cause } : undefined);

    this.name = new.target.name; // nombre de la clase que se instanció
    this.code = code;
    this.statusCode = definition.statusCode;
    this.details = details;
  }
}
