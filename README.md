# ShipNow API

API REST de ShipNow para gestionar **productos** y **usuarios**, con un módulo de **mocking** que genera datos de prueba (usuarios, repartidores, pedidos y entregas) una **capa centralizada de manejo de errores** **logging profesional con Winston** y **documentación interactiva con Swagger** una **suite de tests funcionales** (Mocha, Chai y Supertest) y **carga de archivos con Multer**.

- **Pre-entrega Módulo 1:** arquitectura por capas (Controller → Service → Repository) y configuración de entorno validada.
- **Pre-entrega Módulo 2:** mocking y carga de datos de prueba bajo `/api/mocks`.
- **Pre-entrega Módulo 3:** manejo profesional de errores (errores del dominio, diccionario y middleware global).
- **Pre-entrega Módulo 4:** logging y monitoreo básico (Winston, niveles, archivos con rotación y endpoint de prueba).
- **Pre-entrega Módulo 5:** documentación de la API con Swagger / OpenAPI en `/api/docs`.
- **Pre-entrega Módulo 6:** testing funcional con Mocha, Chai y Supertest (`npm test`).
- **Pre-entrega Módulo 7:** carga de documentos de usuario y comprobantes de entrega con Multer (`multipart/form-data`).

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Cómo correr el proyecto localmente](#cómo-correr-el-proyecto-localmente)
3. [Variables de entorno](#variables-de-entorno)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Arquitectura por capas](#arquitectura-por-capas)
6. [Por qué separé la lógica entre Service y Repository](#por-qué-separé-la-lógica-entre-service-y-repository)
7. [Constantes del dominio](#constantes-del-dominio)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Módulo de mocking (`/api/mocks`)](#módulo-de-mocking-apimocks)
10. [Manejo de errores](#manejo-de-errores)
11. [Cómo probar los casos inválidos](#cómo-probar-los-casos-inválidos)
12. [Logging y monitoreo](#logging-y-monitoreo)
13. [Documentación de la API (Swagger)](#documentación-de-la-api-swagger)
14. [Carga de archivos (Multer)](#carga-de-archivos-multer)
15. [Testing](#testing)
16. [Checklist de la consigna](#checklist-de-la-consigna)

---

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| **Node.js** (ESM) | Entorno de ejecución. Todo el proyecto usa `import` / `export` |
| **Express** | Servidor HTTP y rutas |
| **MongoDB + Mongoose** | Base de datos y modelado de los datos |
| **dotenv** | Carga las variables de entorno desde el archivo `.env` |
| **@faker-js/faker** | Genera datos falsos (nombres, direcciones, etc.) para los mocks |
| **Winston** | Logger centralizado con niveles y salida a consola y archivos |
| **winston-daily-rotate-file** | Rotación diaria de los archivos de log |
| **swagger-ui-express** | Publica la documentación OpenAPI como una página interactiva |
| **Multer** | Recibe archivos enviados como `multipart/form-data` y los guarda en el disco |
| **Mocha** (dev) | Organiza y ejecuta los tests |
| **Chai** (dev) | Librería de aserciones: valida los resultados (`expect(...)`) |
| **Supertest** (dev) | Hace peticiones HTTP a la app Express sin levantar el servidor |
| **cross-env** (dev) | Define `NODE_ENV=test` en cualquier sistema operativo (Windows, Mac, Linux) |

---

## Cómo correr el proyecto localmente

Requisitos: Node.js 18 o superior y una base MongoDB (local o MongoDB Atlas).

```bash
# 1. Clonar el repositorio e instalar dependencias
git clone <url-del-repositorio>
cd shipnow
npm install

# 2. Crear el archivo .env a partir del ejemplo
cp .env.example .env
# (en Windows: copy .env.example .env)

# 3. Completar los valores en .env (ver sección siguiente)

# 4. Levantar el servidor
npm start          # modo normal
npm run dev        # se reinicia solo al guardar cambios
```

Si todo salió bien, la consola muestra:

```
Conexión a MongoDB establecida
ShipNow (development) escuchando en http://localhost:8080
```

---

## Variables de entorno

El archivo `.env` **no está en el repositorio** (está en `.gitignore`). El archivo `.env.example` muestra qué claves hay que completar:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `8080` |
| `MONGODB_URI` | URL de conexión a MongoDB | `mongodb://localhost:27017/shipnow` |
| `NODE_ENV` | Entorno: `development`, `production` o `test` | `development` |

Las tres se validan **al arrancar** (`src/config/env.config.js`). Si falta alguna, o tiene un valor inválido, la app no arranca: registra un error **fatal** que explica qué corregir (en consola y en `logs/`) y termina con código 1:

```
2026-11-15 10:12:03 [fatal]   No se pudo iniciar el servidor: Faltan variables de entorno obligatorias: MONGODB_URI. Revisá tu archivo .env (podés copiar .env.example como punto de partida).
```

`process.env` se lee **únicamente** en ese archivo. El resto del proyecto importa el objeto `config`.

---

## Estructura del proyecto

```
shipnow/
├── .env.example
├── .env.test.example                   # Ejemplo de variables para los tests
├── .mocharc.json                       # Configuración de Mocha
├── .gitignore
├── package.json
├── README.md
├── logs/                               # Archivos de log (ignorados por Git, salvo .gitkeep)
├── uploads/                            # Archivos subidos (se crea sola; ignorada por Git)
│   ├── documents/                      # Documentos de usuario (DNI, licencia...)
│   └── receipts/                       # Comprobantes de entrega
├── tests/                              # Tests funcionales (ver sección Testing)
│   ├── setup.js                        # Conexión a la base de testing y limpieza global
│   ├── helpers/                        # Utilidades: request, database, fixtures, assertions
│   ├── users.test.js
│   ├── orders.test.js
│   ├── mocks.test.js
│   ├── logger.test.js
│   ├── uploads.test.js
│   ├── swagger.test.js
│   └── routes.test.js
└── src/
    ├── server.js                       # Valida config, conecta a la DB y levanta el servidor
    ├── app.js                          # Configura Express y registra las rutas y los middlewares de error
    ├── config/
    │   ├── env.config.js               # Carga y valida las variables de entorno
    │   ├── index.js                    # Re-exporta env.config.js
    │   ├── db.js                       # Conexión a MongoDB
    │   ├── multer.js                   # Configuración centralizada de Multer (carpetas, nombres, tipos, tamaño)
    │   └── logger.js                   # Logger Winston: niveles, formato, consola, archivos y rotación
    ├── constants/
    │   └── index.js                    # Roles, estados y prioridades (Object.freeze)
    ├── docs/                           # Documentación OpenAPI (separada de las rutas)
    │   ├── index.js                    # Arma la especificación completa
    │   ├── swagger.config.js           # Info general, servidor local y tags
    │   ├── schemas.js                  # Schemas reutilizables (User, Order, Delivery, OrderItem, errores...)
    │   ├── responses.js                # Respuestas de error reutilizables
    │   ├── helpers.js                  # Funciones para armar respuestas y parámetros
    │   ├── examples.js                 # Ejemplos de error compartidos
    │   └── paths/                      # Endpoints documentados, un archivo por módulo
    │       ├── users.paths.js
    │       ├── products.paths.js
    │       ├── orders.paths.js
    │       ├── deliveries.paths.js
    │       ├── mocks.paths.js
    │       └── logger.paths.js
    ├── errors/                         # Capa centralizada de errores
    │   ├── error.dictionary.js         # Diccionario: código → status HTTP + mensaje
    │   ├── app.error.js                # Clase base AppError
    │   ├── domain.errors.js            # Errores del dominio (UserNotFoundError, etc.)
    │   └── index.js
    ├── middlewares/
    │   ├── error.middleware.js         # ÚNICO lugar que responde errores al cliente (y los registra)
    │   ├── http.middleware.js          # Registra cada petición (nivel http)
    │   └── upload.middleware.js        # Recibe el archivo con Multer y convierte sus errores
    ├── routes/                         # Solo conectan path → método del Controller
    │   ├── products.router.js
    │   ├── users.router.js
    │   ├── orders.router.js
    │   ├── deliveries.router.js
    │   ├── mocks.router.js
    │   ├── logger.router.js            # Endpoint de prueba del logger
    │   └── docs.router.js              # Publica Swagger UI en /api/docs
    ├── controllers/                    # Manejan req y res; los errores van a next(error)
    │   ├── products.controller.js
    │   ├── users.controller.js
    │   ├── orders.controller.js
    │   ├── deliveries.controller.js
    │   ├── mocks.controller.js
    │   └── logger.controller.js
    ├── services/                       # Lógica de negocio; acá se detectan y lanzan los errores
    │   ├── products.service.js
    │   ├── users.service.js
    │   ├── orders.service.js
    │   ├── deliveries.service.js
    │   ├── mocks.service.js
    │   └── logger.service.js
    ├── repositories/                   # Único lugar que usa los modelos de Mongoose
    │   ├── products.repository.js
    │   ├── users.repository.js
    │   ├── orders.repository.js
    │   └── deliveries.repository.js
    ├── models/                         # Solo los esquemas
    │   ├── Product.js
    │   ├── User.js
    │   ├── Order.js
    │   ├── Delivery.js
    │   └── FileMetadata.js             # Esquema de los metadatos de un archivo (subdocumento)
    └── utils/
        ├── constants.js                # Re-exporta constants/index.js
        ├── files.js                    # Metadatos de archivos y borrado de archivos sueltos
        ├── mock.factories.js           # Generadores de datos falsos (faker)
        └── validators.js
```

---

## Arquitectura por capas

Cada petición atraviesa las capas siempre en el mismo sentido:

```
Cliente → Router → Controller → Service → Repository → MongoDB
                        ↑           │
                        └── next(error) ──→ Middleware de errores → Cliente
```

| Capa | Qué hace | Qué NO hace |
|---|---|---|
| **Router** | Conecta un path y un método HTTP con una función del Controller | No tiene lógica |
| **Controller** | Lee `req`, llama al Service y responde el caso de éxito. Si hay un error, lo pasa con `next(error)` | No valida reglas, no importa Mongoose, no arma respuestas de error |
| **Service** | Valida datos, aplica las reglas de negocio y **lanza errores del dominio** | No conoce `req`/`res` ni Mongoose |
| **Repository** | Busca y guarda datos en MongoDB (filtros, orden y campos por defecto) | No decide reglas de negocio |
| **Model** | Define el esquema de la colección | No tiene lógica |
| **Middleware de errores** | Transforma cualquier error en la respuesta HTTP final | No decide reglas de negocio |

---

## Por qué separé la lógica entre Service y Repository

La regla que usé es: **el Service decide *qué* se necesita y el Repository sabe *cómo* conseguirlo.**

- **Productos con stock.** El listado público solo muestra productos disponibles. Esa es una *regla de negocio*, así que la decide el Service (`getProducts` pide `status: AVAILABLE`). El Repository solo traduce ese pedido a una consulta de MongoDB, y además aplica por defecto el orden (más nuevos primero) y oculta el campo interno `__v`.
- **Estado según stock.** Si el stock es 0, el producto pasa a `OUT_OF_STOCK`. Ese cálculo está en el Service; el Repository simplemente guarda lo que le llega.
- **Email único.** Que no se repitan los emails es una regla de negocio: el Service consulta `getByEmail` y lanza `EmailAlreadyRegisteredError` si ya existe. El Repository solo hace la búsqueda.
- **Mocks.** El Service decide qué pedidos pueden tener entrega (los no cancelados y que todavía no tienen una) y qué repartidor corresponde; los Repositories solo traen e insertan los datos (`getByRole`, `getOrderIds`, `createMany`).
- **Errores.** Los errores se detectan en el Service, porque es quien conoce la regla que se rompió (el Repository solo ve datos y el Controller solo ve HTTP).

**Beneficio:** si mañana se cambia MongoDB por otra base, solo se reescribe el Repository. Y si cambia una regla de negocio, solo se toca el Service. El Controller no se entera de ninguno de los dos cambios.

---

## Constantes del dominio

Están en `src/constants/index.js`, congeladas con `Object.freeze` para que nadie las modifique:

| Constante | Valores |
|---|---|
| `USER_ROLES` | `admin`, `user` (cliente), `courier` (repartidor) |
| `PRODUCT_STATUS` | `available`, `out_of_stock` |
| `ORDER_STATUS` | `pending`, `in_transit`, `delivered`, `cancelled` |
| `ORDER_PRIORITY` | `low`, `medium`, `high` |
| `DELIVERY_STATUS` | `pending`, `in_transit`, `delivered` |
| `MOCK_TYPES` | `users`, `couriers`, `orders`, `deliveries` |

Se usan en los modelos (`enum`), en los services y en los generadores de mocks, en lugar de escribir strings sueltos.

---

## Endpoints de la API

### Productos — `/api/products`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista los productos **con stock** (disponibles) |
| GET | `/api/products/:id` | Devuelve un producto (tenga o no stock) |
| POST | `/api/products` | Crea un producto |
| PUT | `/api/products/:id` | Edita los campos enviados |
| DELETE | `/api/products/:id` | Elimina un producto |

Body para crear: `name` (obligatorio), `price` (obligatorio, ≥ 0), `stock` (obligatorio, entero ≥ 0), `description` (opcional). El `status` no se envía: se calcula según el stock.

### Usuarios — `/api/users`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Lista los usuarios |
| GET | `/api/users/:id` | Devuelve un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:id` | Edita los campos enviados |
| DELETE | `/api/users/:id` | Elimina un usuario |
| POST | `/api/users/:id/documents` | Sube un documento del usuario (`multipart/form-data`) |

Body para crear: `first_name`, `last_name`, `email` (obligatorios) y `role` (opcional: `admin`, `user` o `courier`; por defecto `user`).

La carga de documentos se explica en [Carga de archivos (Multer)](#carga-de-archivos-multer).

### Pedidos — `/api/orders`

Los pedidos se crean con `POST /api/orders` o se generan con la carga de datos de prueba (`POST /api/mocks/seed?type=orders`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders` | Lista los pedidos, los más nuevos primero. Filtro opcional: `?status=pending\|in_transit\|delivered\|cancelled` |
| GET | `/api/orders/:id` | Devuelve un pedido |
| POST | `/api/orders` | Crea un pedido (siempre empieza en `pending`) |

Body para crear: `user` (id de un usuario existente), `items` (lista con al menos un `{ description, quantity, weight }`), `originAddress`, `destinationAddress` (obligatorios) y `priority` (opcional: `low`, `medium` o `high`; por defecto `medium`).

Un pedido tiene: `user` (id del cliente), `items` (lista de `{ description, quantity, weight }`), `originAddress`, `destinationAddress`, `status` y `priority`.

### Entregas — `/api/deliveries`

Las entregas se generan con `POST /api/mocks/seed?type=deliveries`. Solo se les pueden agregar comprobantes (ver [Carga de archivos](#carga-de-archivos-multer)).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/deliveries` | Lista las entregas, las más nuevas primero. Filtro opcional: `?status=pending\|in_transit\|delivered` |
| GET | `/api/deliveries/:id` | Devuelve una entrega |
| POST | `/api/deliveries/:id/receipts` | Sube un comprobante de la entrega (`multipart/form-data`) |

Una entrega tiene: `order` (id del pedido), `courier` (id del repartidor, o `null` si está pendiente), `status`, `scheduledDate` y `receipts` (metadatos de los comprobantes).

Respuesta de éxito: `{ "status": "success", "payload": ... }`. Las respuestas de error están en la sección [Manejo de errores](#manejo-de-errores).

---

## Módulo de mocking (`/api/mocks`)

Sirve para tener datos de prueba sin cargarlos a mano. Tiene dos partes:

1. **Datos simulados:** se generan y se devuelven, **sin guardar nada** en la base.
2. **Carga de datos de prueba (`seed`):** se generan y se **guardan en MongoDB**.

Los datos tienen la misma estructura que los modelos reales y usan las constantes del proyecto (roles, estados y prioridades). Los endpoints de mocks responden directamente con los datos, tal como pide el ejemplo de la consigna del Módulo 2.

### Qué datos se pueden generar

| Dato | Campos | Reglas |
|---|---|---|
| **Usuario** | `first_name`, `last_name`, `email`, `role` | Rol válido (`admin`, `user` o `courier`). Email único, con dominio `@test.com` |
| **Repartidor** | Igual que un usuario | Es un usuario con rol `courier` |
| **Pedido** | `user`, `items` (cada uno con `description`, `quantity` y `weight`), `originAddress`, `destinationAddress`, `status`, `priority` | `user` es el cliente que lo pidió. Entre 1 y 4 items. Estado y prioridad válidos |
| **Entrega** | `order`, `courier`, `status`, `scheduledDate` | `order` es el pedido al que pertenece. Su estado sale del estado del pedido |

### Relaciones

- **Pedido → usuario:** cada pedido pertenece a un cliente.
- **Entrega → pedido:** cada entrega pertenece a un pedido, y un pedido tiene como máximo una entrega.
- **Entrega → repartidor:** solo las entregas que ya salieron (`in_transit` o `delivered`) tienen repartidor, y siempre es un usuario con rol `courier`. Las entregas `pending` tienen `courier: null`.
- **Estado de la entrega según el pedido:** pedido `pending` → entrega `pending`; `in_transit` → `in_transit`; `delivered` → `delivered`. Los pedidos `cancelled` no tienen entrega.

### Datos simulados (no se guardan)

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Usuarios con rol al azar |
| GET | `/api/mocks/couriers?qty=2` | Repartidores (rol `courier`) |
| GET | `/api/mocks/orders?qty=2` | Pedidos |
| GET | `/api/mocks/deliveries?qty=2` | Entregas |

`qty` es la cantidad (entero de 1 a 100; si se omite, son 10). Como estos datos no se guardan, los ids de `user`, `order` y `courier` son ids inventados con formato de MongoDB. Para relaciones reales usá la carga de datos de prueba.

```bash
curl "http://localhost:8080/api/mocks/users?qty=2"
```

```json
[
  { "first_name": "Ana", "last_name": "Pérez", "email": "ana.perez1234@test.com", "role": "user" },
  { "first_name": "Luis", "last_name": "Gómez", "email": "luis.gomez87@test.com", "role": "courier" }
]
```

### Carga de datos de prueba (se guardan)

`POST /api/mocks/seed?type=<tipo>&qty=<cantidad>`

| Parámetro | Valores | Por defecto |
|---|---|---|
| `type` | `users`, `couriers`, `orders`, `deliveries` | `users` |
| `qty` | Entero de 1 a 100 | 10 |

Responde `201` con la cantidad insertada y la colección donde se guardó:

```bash
curl -X POST "http://localhost:8080/api/mocks/seed?qty=10"
```

```json
{ "insertados": 10, "coleccion": "users" }
```

**Orden recomendado**, porque cada tipo usa datos que ya están guardados:

```bash
# 1. Clientes y repartidores
curl -X POST "http://localhost:8080/api/mocks/seed?type=users&qty=10"
curl -X POST "http://localhost:8080/api/mocks/seed?type=couriers&qty=5"

# 2. Pedidos: se asignan a usuarios con rol user que ya existen
curl -X POST "http://localhost:8080/api/mocks/seed?type=orders&qty=20"

# 3. Entregas: se crean sobre pedidos existentes que no estén cancelados y no tengan entrega
curl -X POST "http://localhost:8080/api/mocks/seed?type=deliveries&qty=20"
```

Si hay menos pedidos disponibles que `qty`, se insertan solo las entregas posibles y `insertados` lo refleja. Para verificar lo guardado: `GET /api/users`, `GET /api/orders` y `GET /api/deliveries`, o mirar las colecciones `users`, `orders` y `deliveries` en MongoDB (Compass / Atlas).

---

## Manejo de errores

### Cómo funciona

1. **Detectar:** el Service detecta el problema y lanza un error del dominio, por ejemplo `throw new UserNotFoundError()`.
2. **Derivar:** el Controller no responde errores: los atrapa con `try/catch` y los pasa con `next(error)`.
3. **Responder:** el **middleware global** (`src/middlewares/error.middleware.js`) es el único lugar que arma la respuesta de error. Busca el código del error en el **diccionario** (`src/errors/error.dictionary.js`) para saber qué status HTTP usar.

Hasta la ruta inexistente (404) pasa por este camino: `notFoundHandler` no responde, solo crea un `RouteNotFoundError` y lo deriva al middleware.

### Estructura de la respuesta de error

**Todos** los errores responden con las mismas cuatro claves:

```json
{
  "status": "error",
  "code": "NEGATIVE_QUANTITY",
  "message": "La cantidad (qty) no puede ser negativa",
  "details": []
}
```

| Clave | Contenido |
|---|---|
| `status` | Siempre `"error"` |
| `code` | Código del error, estable y pensado para que lo lea un programa (ej: `USER_NOT_FOUND`) |
| `message` | Explicación para una persona |
| `details` | Lista con más detalle. Vacía (`[]`) si no hay. En los errores de validación trae `{ field, message }` por cada campo inválido |

El status HTTP de la respuesta (400, 404, 409, 500) también sale del diccionario.

Ejemplo con `details` (`POST /api/products` con `{"name":"","price":-5,"stock":-1}`):

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Los datos del producto no son válidos",
  "details": [
    { "field": "name", "message": "El nombre es obligatorio" },
    { "field": "price", "message": "El precio debe ser un número mayor o igual a 0" },
    { "field": "stock", "message": "El stock debe ser un número entero mayor o igual a 0" }
  ]
}
```

### Diccionario de errores

| Código | Status | Cuándo ocurre | Clase |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos inválidos o faltantes en productos/usuarios | `InvalidDataError` |
| `INVALID_ID` | 400 | El id no tiene formato de MongoDB | `InvalidIdError` |
| `INVALID_JSON` | 400 | El body no es un JSON válido | (lo detecta el middleware) |
| `INVALID_STATUS` | 400 | Estado inexistente en el filtro `?status=` de pedidos y entregas | `InvalidStatusError` |
| `INVALID_QUANTITY` | 400 | `qty` no numérico, decimal, 0 o mayor a 100 | `InvalidQuantityError` |
| `NEGATIVE_QUANTITY` | 400 | `qty` negativo | `NegativeQuantityError` |
| `INVALID_MOCK_TYPE` | 400 | `type` desconocido en el seed | `InvalidMockTypeError` |
| `FILE_REQUIRED` | 400 | No se envió el archivo | `FileRequiredError` |
| `INVALID_FILE_FIELD` | 400 | El archivo llegó en un campo distinto de `file` (o se enviaron varios) | `InvalidFileFieldError` |
| `INVALID_DOCUMENT_TYPE` | 400 | `documentType` no es uno de los permitidos | `InvalidDocumentTypeError` |
| `FILE_TOO_LARGE` | 413 | El archivo supera los 5 MB | `FileTooLargeError` |
| `INVALID_FILE_TYPE` | 415 | El tipo de archivo no es PDF, JPG ni PNG | `InvalidFileTypeError` |
| `USER_NOT_FOUND` | 404 | El usuario no existe | `UserNotFoundError` |
| `PRODUCT_NOT_FOUND` | 404 | El producto no existe | `ProductNotFoundError` |
| `ORDER_NOT_FOUND` | 404 | El pedido no existe | `OrderNotFoundError` |
| `DELIVERY_NOT_FOUND` | 404 | La entrega no existe | `DeliveryNotFoundError` |
| `ROUTE_NOT_FOUND` | 404 | La ruta no existe | `RouteNotFoundError` |
| `EMAIL_ALREADY_REGISTERED` | 409 | Ya hay un usuario con ese email | `EmailAlreadyRegisteredError` |
| `MOCK_PREREQUISITE_MISSING` | 409 | Falta cargar datos previos (ej: pedidos sin usuarios) | `MockPrerequisiteError` |
| `MOCK_GENERATION_FAILED` | 500 | Falló la generación de datos de prueba | `MockGenerationError` |
| `MOCK_INSERT_FAILED` | 500 | Falló la carga en MongoDB | `MockInsertError` |
| `FILE_SAVE_FAILED` | 500 | No se pudo guardar el archivo o sus metadatos | `FileSaveError` |
| `INTERNAL_ERROR` | 500 | Cualquier error inesperado | (lo arma el middleware) |

### Errores 500 y seguridad

En los errores 500 el cliente **nunca** recibe el detalle técnico (por ejemplo, un mensaje de MongoDB que podría incluir la URI o datos internos). El error original se conserva (`cause`) y se registra solo en el log del servidor (consola y `logs/error-*.log`).

### Mocks: cómo se controlan los problemas

- **Parámetros inválidos:** `qty` y `type` se validan **antes** de generar o tocar la base. Un pedido inválido nunca guarda datos.
- **Datos previos faltantes:** responde 409 explicando qué cargar primero.
- **Falla al generar** (error inesperado dentro de los generadores): `MOCK_GENERATION_FAILED`.
- **Falla en MongoDB** (base caída, error de inserción, etc.): `MOCK_INSERT_FAILED`. La carga usa `insertMany`, que se detiene en el primer error; los registros insertados antes de la falla (si los hubo) quedan guardados.

---

## Cómo probar los casos inválidos

Con el servidor levantado (`npm start`). Agregá `-i` a `curl` para ver también el status HTTP. En todos los casos la respuesta tiene la estructura `status / code / message / details`.

### Productos, usuarios y rutas

| # | Comando | Esperado |
|---|---|---|
| 1 | `curl -i -X POST localhost:8080/api/products -H "Content-Type: application/json" -d '{"name":"","price":-5,"stock":-1}'` | 400 `VALIDATION_ERROR` con 3 elementos en `details` |
| 2 | `curl -i localhost:8080/api/products/123` | 400 `INVALID_ID` |
| 3 | `curl -i localhost:8080/api/products/000000000000000000000000` | 404 `PRODUCT_NOT_FOUND` |
| 4 | `curl -i localhost:8080/api/users/000000000000000000000000` | 404 `USER_NOT_FOUND` |
| 5 | `curl -i -X POST localhost:8080/api/users -H "Content-Type: application/json" -d '{"first_name":"Ana","last_name":"Pérez","email":"mal","role":"root"}'` | 400 `VALIDATION_ERROR` (`email` y `role`) |
| 6 | Crear dos veces el mismo usuario: `curl -i -X POST localhost:8080/api/users -H "Content-Type: application/json" -d '{"first_name":"Ana","last_name":"Pérez","email":"ana@mail.com"}'` | La 2ª vez: 409 `EMAIL_ALREADY_REGISTERED` |
| 7 | `curl -i -X POST localhost:8080/api/products -H "Content-Type: application/json" -d '{"name":'` | 400 `INVALID_JSON` |
| 8 | `curl -i localhost:8080/api/ruta-que-no-existe` | 404 `ROUTE_NOT_FOUND` |

### Mocks

| # | Comando | Esperado |
|---|---|---|
| 9 | `curl -i "localhost:8080/api/mocks/users?qty=-5"` | 400 `NEGATIVE_QUANTITY` |
| 10 | `curl -i "localhost:8080/api/mocks/orders?qty=0"` | 400 `INVALID_QUANTITY` |
| 11 | `curl -i "localhost:8080/api/mocks/couriers?qty=abc"` | 400 `INVALID_QUANTITY` |
| 12 | `curl -i "localhost:8080/api/mocks/deliveries?qty=2.5"` | 400 `INVALID_QUANTITY` |
| 13 | `curl -i "localhost:8080/api/mocks/users?qty=101"` | 400 `INVALID_QUANTITY` (el máximo es 100) |
| 14 | `curl -i -X POST "localhost:8080/api/mocks/seed?type=users&qty=-3"` | 400 `NEGATIVE_QUANTITY` (no guarda nada) |
| 15 | `curl -i -X POST "localhost:8080/api/mocks/seed?type=pizzas&qty=5"` | 400 `INVALID_MOCK_TYPE` |
| 16 | Con la base **sin usuarios**: `curl -i -X POST "localhost:8080/api/mocks/seed?type=orders&qty=5"` | 409 `MOCK_PREREQUISITE_MISSING` (pide cargar usuarios) |
| 17 | Con la base **sin pedidos**: `curl -i -X POST "localhost:8080/api/mocks/seed?type=deliveries&qty=5"` | 409 `MOCK_PREREQUISITE_MISSING` (pide cargar pedidos) |

Para los casos 16 y 17 empezá con las colecciones vacías (podés borrarlas desde Compass / Atlas).

### Pedidos y entregas

| # | Comando | Esperado |
|---|---|---|
| 18 | `curl -i "localhost:8080/api/orders?status=shipped"` | 400 `INVALID_STATUS` |
| 19 | `curl -i localhost:8080/api/orders/000000000000000000000000` | 404 `ORDER_NOT_FOUND` |
| 20 | `curl -i "localhost:8080/api/deliveries?status=lost"` | 400 `INVALID_STATUS` |
| 21 | `curl -i localhost:8080/api/deliveries/000000000000000000000000` | 404 `DELIVERY_NOT_FOUND` |

### Falla de MongoDB durante la carga

Con el servidor ya levantado, **detené MongoDB** (o cortá la conexión a Atlas) y ejecutá:

```bash
curl -i -X POST "localhost:8080/api/mocks/seed?type=users&qty=5"
```

Esperado: 500 `MOCK_INSERT_FAILED` con el mensaje `No se pudieron guardar los datos de prueba (type=users) en MongoDB`. Puede tardar unos segundos en responder, hasta que el driver de MongoDB se rinde. El detalle técnico aparece en el log del servidor (consola y `logs/error-*.log`), no en la respuesta.

---

## Logging y monitoreo

### Qué herramienta se usa

**Winston** (con `winston-daily-rotate-file` para rotar los archivos). El logger se configura **una sola vez** en `src/config/logger.js` y se usa desde cualquier archivo, sin repetir configuración:

```js
import logger from "../config/logger.js";

logger.info("Servidor iniciado");
```

Ya no quedan `console.log()` ni `console.error()` en el código: todo pasa por el logger.

### Niveles de log

De **más grave a menos grave**. Cada entorno registra desde un nivel hacia arriba (ver tabla siguiente).

| Nivel | Cuándo se usa | Ejemplo en ShipNow |
|---|---|---|
| `fatal` | Falla crítica: la app no puede seguir | Configuración inválida o MongoDB inaccesible al arrancar |
| `error` | Error inesperado del servidor (500) | Falló la carga de datos de prueba en MongoDB |
| `warning` | Error esperado o de negocio (4xx) | Ruta inexistente, `qty` inválida, usuario o pedido no encontrado |
| `info` | Eventos importantes | Servidor iniciado, conexión a MongoDB, datos de prueba insertados |
| `http` | Cada petición recibida | `GET /api/products 200 - 12ms` |
| `debug` | Detalle para desarrollar | Parámetros de una carga de datos de prueba |

### Desarrollo vs. producción

El comportamiento depende de `NODE_ENV` (la variable validada en `src/config/env.config.js`):

| `NODE_ENV` | Nivel mínimo | Se registra | Archivos |
|---|---|---|---|
| `development` | `debug` | Todos los niveles | Sí |
| `production` | `info` | `fatal`, `error`, `warning` e `info` (sin `http` ni `debug`) | Sí |
| `test` | `warning` | `fatal`, `error` y `warning` | No |

### Formato

Nivel + fecha y hora + mensaje, igual en consola (con colores) y en archivo (texto plano):

```
2026-11-15 10:12:03 [info]    Conexión a MongoDB establecida
2026-11-15 10:12:03 [info]    Servidor ShipNow escuchando en el puerto 8080 (entorno: development)
2026-11-15 10:14:21 [warning] ROUTE_NOT_FOUND en GET /api/nada: No se encontró la ruta GET /api/nada
2026-11-15 10:15:09 [error]   MOCK_INSERT_FAILED en POST /api/mocks/seed: No se pudieron guardar los datos de prueba (type=users) en MongoDB
```

### Dónde se guardan los archivos

En la carpeta `logs/` de la raíz del proyecto (se crea sola al arrancar):

| Archivo | Contenido |
|---|---|
| `logs/error-AAAA-MM-DD.log` | **Solo** `error` y `fatal` |
| `logs/combined-AAAA-MM-DD.log` | Todos los niveles que el entorno registra |

**Rotación:** se crea un archivo nuevo **cada día**, cada archivo pesa como máximo **10 MB**, se conservan **14 días** y los archivos viejos se comprimen (`.gz`). Así el historial queda ordenado y no crece sin control. La librería también crea archivos auxiliares (`*-audit.json`) para llevar la cuenta de los archivos rotados.

### Qué se ignora en Git

En `.gitignore`: `logs/*` (todo lo que genera la aplicación) excepto `logs/.gitkeep`, un archivo vacío que mantiene la carpeta en el repositorio. También se ignoran `.env` y `node_modules`.

### Qué se registra

| Evento | Nivel | Dónde |
|---|---|---|
| Servidor iniciado | `info` | `server.js` |
| Conexión exitosa a MongoDB | `info` | `config/db.js` |
| Error al conectar con MongoDB, o configuración inválida | `fatal` | `server.js` (la app no arranca) |
| Cada petición HTTP | `http` | `middlewares/http.middleware.js` |
| Error esperado (validación, no encontrado, ruta inexistente, `qty` inválida, datos previos faltantes) | `warning` | `middlewares/error.middleware.js` |
| Error inesperado o falla de MongoDB en los mocks (con el stack original) | `error` | `middlewares/error.middleware.js` |
| Datos de prueba generados (`GET /api/mocks/...`) | `info` | `services/mocks.service.js` |
| Datos de prueba insertados, incluidos los pedidos (`POST /api/mocks/seed`) | `info` | `services/mocks.service.js` |
| Producto o usuario creado, actualizado o eliminado | `info` | `services/products.service.js`, `services/users.service.js` |

El logger **complementa** al manejo de errores del módulo anterior: la respuesta al cliente sigue siendo la misma (`status`, `code`, `message`, `details`) y el detalle técnico solo queda en el log.

> Hoy los pedidos solo se crean desde la carga de datos de prueba (`type=orders`), así que el registro de "pedidos creados" es el de esa operación.

### Cómo probar el endpoint del logger

`GET /api/logger/test` es una herramienta interna (no es parte del negocio): escribe un mensaje en **cada** nivel y responde cuáles se registraron en el entorno actual.

```bash
curl http://localhost:8080/api/logger/test
```

```json
{
  "status": "success",
  "payload": {
    "environment": "development",
    "activeLevel": "debug",
    "levels": { "debug": true, "http": true, "info": true, "warning": true, "error": true, "fatal": true }
  }
}
```

Para comprobar la configuración completa:

1. **Consola (desarrollo).** Con `NODE_ENV=development`, ejecutá el `curl`: en la consola del servidor aparecen 6 líneas de prueba (`debug`, `http`, `info`, `warning`, `error`, `fatal`) más la línea `http` de la propia petición.
2. **Archivo de errores.** Abrí `logs/error-AAAA-MM-DD.log`: solo tiene las líneas `error` y `fatal`.
3. **Archivo combinado.** Abrí `logs/combined-AAAA-MM-DD.log`: tiene todos los niveles.
4. **Producción.** Cambiá a `NODE_ENV=production`, reiniciá y repetí el `curl`: ya no aparecen `debug` ni `http`, y en la respuesta esos niveles figuran en `false`.
5. **Errores reales.** Probá los casos inválidos de la sección anterior (por ejemplo `curl "localhost:8080/api/mocks/users?qty=-5"` o `curl localhost:8080/api/nada`): cada uno deja un `warning` en el log.
6. **Fatal.** Borrá `MONGODB_URI` del `.env` y ejecutá `npm start`: la app no arranca y deja un `fatal` en consola y en `logs/error-*.log`.

---

## Documentación de la API (Swagger)

### Cómo acceder

1. Levantá el servidor (ver [Cómo correr el proyecto localmente](#cómo-correr-el-proyecto-localmente)): `npm install`, completar el `.env` y `npm start`.
2. Abrí en el navegador: **`http://localhost:8080/api/docs`** (el puerto es el de la variable `PORT`).

Desde esa página se puede consultar cada endpoint y probarlo con el botón **Try it out → Execute**. El servidor que figura en la documentación (`Servidor local`) usa el mismo puerto que `PORT`.

### Qué está documentado

Los 23 endpoints de la API, agrupados por **tags**:

| Tag | Endpoints |
|---|---|
| **Users** | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}`, `POST /api/users/{id}/documents` (multipart) |
| **Products** | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` |
| **Orders** | `GET/POST /api/orders` (filtro `?status=` en el GET), `GET /api/orders/{id}` |
| **Deliveries** | `GET /api/deliveries` (filtro `?status=`), `GET /api/deliveries/{id}`, `POST /api/deliveries/{id}/receipts` (multipart) |
| **Mocks** | `GET /api/mocks/users`, `/couriers`, `/orders`, `/deliveries` y `POST /api/mocks/seed` |
| **Logger** | `GET /api/logger/test` |

> `Products` no está entre los tags que menciona la consigna, pero se documenta porque es parte de la API real.

De cada endpoint se documenta: método y ruta, descripción, parámetros (de ruta y de query), body esperado, respuesta exitosa y posibles respuestas de error con un ejemplo real de cada una.

La información general de la documentación (nombre, versión, descripción y propósito, servidor local y tags) está en `src/docs/swagger.config.js`.

### Schemas reutilizables

`User`, `Product`, `Order`, `OrderItem`, `Delivery`, `SuccessResponse`, `ErrorResponse` y `ErrorDetail`, además de los de entrada (`UserInput`, `ProductInput`, etc.) y los de mocks (`MockUser`, `MockOrder`, `MockDelivery`, `MockSeedResult`). Los valores permitidos (roles, estados, prioridades y códigos de error) se toman de las constantes del proyecto, así la documentación no se desactualiza si cambian.

### Errores documentados

Todos usan el schema `ErrorResponse` (`status`, `code`, `message`, `details`) y son los mismos que devuelve la API (ver [Manejo de errores](#manejo-de-errores)):

| Tipo | Códigos | Dónde |
|---|---|---|
| Datos inválidos | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_ID` | Users, Products, Orders, Deliveries |
| Recurso no encontrado | `USER_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `DELIVERY_NOT_FOUND` | por id |
| Conflicto | `EMAIL_ALREADY_REGISTERED` | Users |
| Estado inválido | `INVALID_STATUS` | Orders y Deliveries (`?status=`) |
| Cantidad inválida en mocks | `INVALID_QUANTITY`, `NEGATIVE_QUANTITY`, `INVALID_MOCK_TYPE` | Mocks |
| Datos previos faltantes en la carga | `MOCK_PREREQUISITE_MISSING` | `POST /api/mocks/seed` |
| Error interno | `INTERNAL_ERROR`, `MOCK_GENERATION_FAILED`, `MOCK_INSERT_FAILED` | todos los endpoints con base de datos y Mocks |
| Autenticación | No aplica | La API no tiene autenticación, así que no hay respuestas 401 ni 403 |

### Aclaraciones para probar los endpoints

- **Para tener datos**, desde Swagger ejecutá en este orden `POST /api/mocks/seed` con `type=users`, `couriers`, `orders` y `deliveries` (ver [Carga de datos de prueba](#carga-de-datos-de-prueba-se-guardan)). Después `GET /api/orders` y `GET /api/deliveries` devuelven datos y de ahí se copian ids para probar los endpoints `{id}`.
- **La carga de datos de prueba no recibe body**: `type` y `qty` van por query (`?type=orders&qty=20`).
- **Los endpoints de Mocks** responden directamente con los datos (sin `status` ni `payload`); los demás usan `{ "status": "success", "payload": ... }`.
- **Las entregas** se crean con la carga de datos de prueba; solo se les pueden agregar comprobantes. Los pedidos se pueden crear con `POST /api/orders`.
- **Los endpoints de archivos** usan `multipart/form-data`: en Swagger se elige el archivo con el botón *Choose File* del campo `file`.
- **`GET /api/products`** lista solo los productos con stock; un producto sin stock se consulta por id.
- **Mocks y Logger** son herramientas internas de prueba, no funcionalidades de negocio. El logger escribe en consola y en `logs/` cada vez que se ejecuta.
- Los ids de ejemplo de la documentación tienen formato válido pero no existen: usá ids reales de tu base.

### Cómo está organizada

La configuración de Swagger vive en `src/docs/` y **no se mezcla con la lógica de las rutas**: `src/routes/docs.router.js` solo publica la documentación en `/api/docs`, y los archivos de rutas de la API no tienen ningún comentario ni anotación de Swagger. Cada módulo tiene su archivo en `src/docs/paths/`.

---

## Carga de archivos (Multer)

**Multer** es una librería de Express que recibe archivos enviados en formato `multipart/form-data` (el formato de los formularios con archivos). Los endpoints guardan el archivo en una carpeta del servidor y en la base de datos registran **solo los metadatos**, nunca el archivo.

### Endpoints

| Método | Ruta | Qué hace | Campos del formulario |
|---|---|---|---|
| POST | `/api/users/:id/documents` | Sube un documento y lo asocia al usuario | `file` (obligatorio) y `documentType` (opcional) |
| POST | `/api/deliveries/:id/receipts` | Sube un comprobante y lo asocia a la entrega | `file` (obligatorio) |

Los dos responden `201` con la entidad **actualizada** (`{ "status": "success", "payload": ... }`): el usuario con su lista `documents`, o la entrega con su lista `receipts`.

Reglas de los archivos (están en `FILE_UPLOAD` de `src/constants/index.js`):

- El archivo va en el campo **`file`**.
- Tipos permitidos: **PDF, JPG y PNG** (`application/pdf`, `image/jpeg`, `image/png`).
- Tamaño máximo: **5 MB**. Un archivo por petición.
- `documentType` (solo en documentos de usuario): `dni`, `license`, `address_proof` u `other`. Si no se envía, se usa `other`. Los comprobantes de entrega se guardan con el tipo `delivery_receipt`.

Ejemplo:

```bash
curl -i -X POST http://localhost:8080/api/users/<ID_USUARIO>/documents \
  -F "documentType=dni" \
  -F "file=@dni-frente.pdf;type=application/pdf"
```

### Dónde se guardan los archivos

```
uploads/
├── documents/    # documentos de usuario (DNI, licencia...)
└── receipts/     # comprobantes de entrega
```

Las carpetas se crean solas. **`uploads/` está en `.gitignore`**: los archivos subidos no van al repositorio. Cada archivo se renombra a `<fecha>-<id aleatorio>.<extensión>` (por ejemplo `1763299500000-4f6e0c1a-....pdf`), así dos archivos nunca se pisan y el nombre original del usuario no se usa en el disco. La extensión se decide según el tipo del archivo, no según el nombre que mandó el cliente.

### Metadatos que se guardan en la base

Cada archivo es un subdocumento en `User.documents` o `Delivery.receipts`:

| Campo | Descripción |
|---|---|
| `originalName` | Nombre original del archivo |
| `fileName` | Nombre generado con el que se guardó |
| `path` | Ruta relativa en el servidor (ej: `uploads/documents/1763299500000-....pdf`) |
| `mimeType` | Tipo del archivo (ej: `application/pdf`) |
| `size` | Tamaño en bytes |
| `documentType` | Tipo de documento |
| `uploadedAt` | Fecha de carga |

### Cómo está organizado

| Archivo | Responsabilidad |
|---|---|
| `src/config/multer.js` | **Configuración centralizada**: carpeta de destino, cómo se nombran, tipos aceptados y tamaño máximo. Los routers no configuran Multer |
| `src/middlewares/upload.middleware.js` | Recibe el archivo antes del controller y convierte los errores de Multer en errores del proyecto |
| `src/models/FileMetadata.js` | Esquema de los metadatos (subdocumento de usuarios y entregas) |
| `src/utils/files.js` | Arma los metadatos y borra archivos sueltos |
| `users.service.js` / `deliveries.service.js` | Validan (archivo, tipo de documento, entidad existente) y asocian el archivo a la entidad |

Flujo: **Router → middleware de Multer (guarda el archivo) → Controller → Service (valida y asocia) → Repository (guarda los metadatos)**.

### Errores de archivos

Responden con el mismo formato de siempre (`status`, `code`, `message`, `details`):

| Caso | Status | Código |
|---|---|---|
| No se envió el archivo | 400 | `FILE_REQUIRED` |
| El archivo vino en otro campo (no `file`) | 400 | `INVALID_FILE_FIELD` |
| `documentType` inválido | 400 | `INVALID_DOCUMENT_TYPE` |
| Id con formato inválido | 400 | `INVALID_ID` |
| Usuario o entrega inexistente | 404 | `USER_NOT_FOUND` / `DELIVERY_NOT_FOUND` |
| El archivo supera los 5 MB | 413 | `FILE_TOO_LARGE` |
| Tipo de archivo no permitido | 415 | `INVALID_FILE_TYPE` |
| No se pudo guardar el archivo o sus metadatos | 500 | `FILE_SAVE_FAILED` |

**Sin archivos sueltos:** Multer guarda el archivo antes de que el service compruebe que el usuario o la entrega existen. Si algo falla después (usuario inexistente, tipo de documento inválido, error de la base), el service **borra el archivo del disco**, así no quedan archivos sin asociar a ninguna entidad.

### Logs

| Evento | Nivel |
|---|---|
| Documento cargado / comprobante asociado a una entrega | `info` |
| Intento de subir un tipo de archivo no permitido | `warning` |
| Archivo rechazado por tamaño | `warning` |
| Error al subir (cualquier error esperado) | `warning` (lo registra el middleware global de errores) |
| Falla al guardar el archivo o sus metadatos | `error` (con el error original) |

### Limitación conocida

El tipo de archivo se valida con el tipo (`Content-Type`) que declara el cliente. Un cliente malicioso podría declarar un tipo falso; para un proyecto de producción habría que verificar además el contenido real del archivo.

---

## Testing

Suite de tests **funcionales** (de punta a punta): cada test hace una petición HTTP real a la app Express, que usa la base de datos de testing, y comprueba el **status**, la **estructura del body** y sus propiedades importantes.

### Herramientas

| Herramienta | Para qué se usa |
|---|---|
| **Mocha** | Organiza (`describe` / `it`) y ejecuta los tests, y corre los hooks de limpieza (`before`, `beforeEach`, `after`) |
| **Chai** | Valida los resultados con `expect(...)` |
| **Supertest** | Hace las peticiones HTTP a la app sin abrir un puerto a mano |

La app está separada del servidor: `src/app.js` solo configura Express (y es lo que importan los tests) y `src/server.js` conecta la base y hace `listen`.

### Cómo ejecutar los tests

```bash
# 1. Instalar dependencias (incluye las de desarrollo)
npm install

# 2. Crear el archivo de variables de testing a partir del ejemplo
cp .env.test.example .env.test      # en Windows: copy .env.test.example .env.test

# 3. Correr toda la suite
npm test
```

`npm test` ejecuta `cross-env NODE_ENV=test mocha`. También se puede correr un solo módulo, por ejemplo `npx cross-env NODE_ENV=test mocha tests/orders.test.js`.

### Base de datos y variables de entorno

**Sí, requiere una base de datos MongoDB de testing**, distinta a la de desarrollo (local o un cluster de Atlas). Se configura en `.env.test` (que no se sube al repositorio; el ejemplo es `.env.test.example`):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Obligatoria para la validación de config, pero los tests no abren ningún puerto | `8081` |
| `MONGODB_URI` | Base **exclusiva para tests**. El nombre de la base debe contener `test` | `mongodb://localhost:27017/shipnow_test` |
| `NODE_ENV` | Siempre `test` (el script de `npm test` ya lo define) | `test` |

**Entorno separado del de desarrollo:** cuando `NODE_ENV=test`, `src/config/env.config.js` carga `.env.test` en lugar de `.env`. Además, en ese entorno el logger no escribe archivos en `logs/`.

**Protección:** como los tests borran datos, antes de limpiar se verifica que `NODE_ENV` sea `test` y que el nombre de la base contenga `test`. Si no, la suite se detiene con un error y no toca nada.

### Módulos cubiertos

| Archivo | Qué prueba |
|---|---|
| `tests/users.test.js` | `GET /api/users`, `GET /api/users/:id`, `POST /api/users` |
| `tests/orders.test.js` | `GET /api/orders` (con filtro `?status=`), `GET /api/orders/:id`, `POST /api/orders` |
| `tests/mocks.test.js` | `GET /api/mocks/users\|couriers\|orders\|deliveries` y `POST /api/mocks/seed` |
| `tests/logger.test.js` | `GET /api/logger/test` |
| `tests/uploads.test.js` | `POST /api/users/:id/documents` y `POST /api/deliveries/:id/receipts` (carga de archivos) |
| `tests/swagger.test.js` | `GET /api/docs` y la especificación OpenAPI |
| `tests/routes.test.js` | Rutas inexistentes (404) |

Casos exitosos: listados, consulta por id, crear usuario y pedido con datos válidos, generar mocks y cargarlos, logger y Swagger.
Casos de error (con el status y el formato `{ status, code, message, details }` del módulo de errores):

| Caso | Status | Código |
|---|---|---|
| Datos incompletos o inválidos (usuario, pedido, items) | 400 | `VALIDATION_ERROR` |
| Id con formato inválido | 400 | `INVALID_ID` |
| Estado inválido (`GET /api/orders?status=shipped`) | 400 | `INVALID_STATUS` |
| Mocks con cantidad inválida (0, 101, texto, decimal) | 400 | `INVALID_QUANTITY` |
| Mocks con cantidad negativa | 400 | `NEGATIVE_QUANTITY` |
| Tipo de mock inválido | 400 | `INVALID_MOCK_TYPE` |
| Body que no es un JSON | 400 | `INVALID_JSON` |
| Recurso inexistente (usuario, pedido) | 404 | `USER_NOT_FOUND` / `ORDER_NOT_FOUND` |
| Ruta inexistente | 404 | `ROUTE_NOT_FOUND` |
| Falta el archivo | 400 | `FILE_REQUIRED` |
| Archivo en un campo incorrecto | 400 | `INVALID_FILE_FIELD` |
| Tipo de documento inválido | 400 | `INVALID_DOCUMENT_TYPE` |
| Archivo demasiado grande (más de 5 MB) | 413 | `FILE_TOO_LARGE` |
| Tipo de archivo no permitido | 415 | `INVALID_FILE_TYPE` |
| Usuario o entrega inexistente al subir un archivo | 404 | `USER_NOT_FOUND` / `DELIVERY_NOT_FOUND` |
| Email repetido | 409 | `EMAIL_ALREADY_REGISTERED` |
| Cargar pedidos sin usuarios previos | 409 | `MOCK_PREREQUISITE_MISSING` |

> **Estados:** la API no tiene un endpoint para actualizar el estado de un pedido (no aplica en este proyecto). El caso "estado inválido" se cubre con el filtro `?status=` de pedidos, que valida el estado y está documentado en Swagger.

### Datos de prueba y limpieza

- **Datos controlados:** cada test crea lo que necesita con los *fixtures* de `tests/helpers/fixtures.js` (por ejemplo, un usuario válido antes de crear un pedido). No se usan datos cargados a mano ni datos reales. Los emails son únicos en cada llamada.
- **Limpieza:** `tests/setup.js` vacía la base antes de empezar y otra vez al terminar (hooks `before` / `after`), y cada módulo vacía las colecciones **antes de cada test** (`beforeEach(clearDatabase)`). Así ningún test depende del estado previo ni del orden, y la suite se puede correr varias veces seguidas.
- **Coherencia con Swagger:** `tests/swagger.test.js` comprueba que cada comportamiento que se prueba (200, 201, 400, 404, 409...) está documentado en la especificación; por ejemplo, `GET /api/orders/{id}` documenta el 404 y `orders.test.js` lo verifica contra la API real.
- **Archivos de los tests:** en el entorno de testing Multer guarda en `uploads-test/` (no en `uploads/`), que está en `.gitignore`. Los tests crean sus archivos en memoria, los borran antes de cada test y al terminar, y comprueban que los errores no dejen archivos sueltos en el disco.
- Los logs de los tests se silencian en la consola para que la salida muestre solo los resultados (se puede reactivar en `tests/setup.js`).

---

## Checklist de la consigna

**Módulo 1**
- [x] Carpetas `controllers/`, `services/`, `repositories/`, `models/` y `config/`
- [x] Flujo Controller → Service → Repository; el Controller no importa Mongoose
- [x] Repository con acceso encapsulado, sin lógica de negocio
- [x] Routers mínimos: solo conectan path con método del Controller
- [x] `.env` fuera del repositorio y `.env.example` incluido
- [x] Configuración validada al arrancar; `process.env` solo en el archivo de configuración
- [x] Constantes con `Object.freeze`, sin strings mágicos

**Módulo 2**
- [x] Router específico bajo `/api/mocks`
- [x] Datos simulados sin guardar y carga controlada en MongoDB
- [x] Lógica de mocking en capas; relaciones pedido ↔ usuario, entrega ↔ pedido, repartidor con rol `courier`
- [x] Se usan las constantes para roles, estados y prioridades

**Módulo 3**
- [x] Errores personalizados del dominio (`src/errors/domain.errors.js`)
- [x] Diccionario de errores (`src/errors/error.dictionary.js`)
- [x] Middleware global que transforma los errores en respuestas uniformes
- [x] Ninguna respuesta de error en rutas ni controllers: todo se deriva con `next(error)`
- [x] Los errores se detectan en los services; la respuesta sale solo del middleware (incluida la ruta inexistente)
- [x] Estructura de error única: `status`, `code`, `message`, `details`
- [x] Mocks validados: cantidad inválida, valores negativos, tipo inválido, datos previos faltantes y fallas de generación o de carga en MongoDB
- [x] Repositorio sin `node_modules` (en `.gitignore`)

**Módulo 4**
- [x] Logger centralizado con Winston en `src/config/logger.js`, reutilizable desde cualquier archivo
- [x] Niveles `debug`, `http`, `info`, `warning`, `error` y `fatal`
- [x] Formato nivel + timestamp + mensaje, en consola y en archivo
- [x] Comportamiento distinto según `NODE_ENV` (desarrollo: `debug`; producción: `info`)
- [x] Integrado con el middleware global de errores: errores esperados como `warning`, inesperados como `error`, fallas de arranque como `fatal`
- [x] Eventos registrados: arranque, conexión a MongoDB, mocks, entidades, ruta inexistente y errores
- [x] Logs persistidos en `logs/` (`error-*.log` solo con `error` y `fatal`) con rotación diaria, tamaño máximo y 14 días de retención
- [x] Archivos de log fuera del repositorio (`.gitignore`), con `logs/.gitkeep` para conservar la carpeta
- [x] Endpoint de prueba `GET /api/logger/test` que genera logs de todos los niveles
- [x] Sin `console.log()` ni `console.error()` en el código
- [x] README actualizado

**Módulo 5**
- [x] Swagger UI en una ruta específica (`/api/docs`), con la configuración separada de la lógica de rutas (`src/docs/`)
- [x] Información general: nombre, versión, descripción, propósito y servidor local
- [x] Endpoints agrupados por tags: Users, Orders, Deliveries, Mocks y Logger (más Products, que existe en la API)
- [x] Cada endpoint documenta método, ruta, descripción, parámetros, body, respuesta exitosa y errores posibles
- [x] Schemas reutilizables: usuario, pedido, entrega, item de pedido, respuesta de error y respuesta exitosa
- [x] Errores documentados iguales a los reales: datos inválidos, no encontrado, error interno, cantidad inválida en mocks y estado inválido
- [x] Mocks documentados: obtener datos simulados, cargar datos de prueba y errores de cantidad
- [x] Logger documentado como herramienta de validación, no de negocio
- [x] Sin documentar respuestas que la API no devuelve (sin 401/403: no hay autenticación)
- [x] README con la ruta de Swagger, cómo levantar el servidor y qué módulos están documentados

**Módulo 6**
- [x] Entorno de testing separado: `.env.test`, `NODE_ENV=test` y base de datos propia (con protección contra borrar la base de desarrollo)
- [x] Mocha, Chai y Supertest instalados, con el script `npm test`
- [x] `app.js` separada de `server.js`: los tests importan la app sin abrir un puerto
- [x] Tests de usuarios, pedidos (listar, crear y consultar por id), mocks, logger y Swagger
- [x] Casos exitosos y de error, validando status y formato de error del módulo de errores
- [x] Cada test valida la estructura del body y sus propiedades importantes
- [x] Datos de prueba creados dentro de los tests; limpieza con hooks `before` / `beforeEach` / `after`
- [x] Coherencia con Swagger: los comportamientos documentados tienen su test (y `POST /api/orders` quedó documentado)
- [x] Tests organizados en `tests/`, agrupados por módulo
- [x] README con la sección de [Testing](#testing)

**Módulo 7**
- [x] Multer instalado y configurado en un solo lugar (`src/config/multer.js`), separado de los routers: destino, nombre, tipos aceptados y tamaño máximo
- [x] Carpeta `uploads/` con subcarpetas por tipo (`documents/`, `receipts/`), ignorada en `.gitignore` (y `uploads-test/` para los tests)
- [x] Validaciones: archivo requerido, tipo permitido, tamaño máximo, campo correcto y `documentType` válido
- [x] `POST /api/users/:id/documents`: verifica que el usuario exista, valida y guarda el archivo y registra los metadatos en el usuario
- [x] `POST /api/deliveries/:id/receipts`: verifica que la entrega exista, guarda el archivo, registra los metadatos y devuelve la entrega actualizada
- [x] En la base solo se guardan metadatos (nombre original, nombre generado, ruta, tipo, tamaño, tipo de documento y fecha de carga)
- [x] Errores específicos de archivos con el formato general del proyecto (archivo requerido, tipo inválido, tamaño superado, tipo de documento inválido, entidad no encontrada y error al guardar)
- [x] Logger: carga exitosa, comprobante asociado, tipo no permitido y errores de carga
- [x] Swagger: endpoints como `multipart/form-data` con el campo `file`, campos adicionales, tipos de documento, respuesta exitosa y errores
- [x] Tests funcionales: carga correcta, archivo faltante, tipo de documento inválido, entidad inexistente, tipo y tamaño de archivo inválidos
- [x] Sin archivos subidos en el repositorio (ni `node_modules`)
