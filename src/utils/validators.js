// Funciones chicas de validación que usan los services.
// Ninguna depende de Mongoose.

export const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

// Un id de MongoDB tiene 24 caracteres hexadecimales
export const isValidId = (value) => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

export const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Acepta 10 o "10" y devuelve el número; cualquier otra cosa devuelve NaN
export const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
};
