# 🧼 J&L Clean Co. - Backend

Backend de la aplicación **J&L Clean Co.**, un sistema de gestión de usuarios, productos, carrito de compras y ventas para una empresa de productos de limpieza.

---

## 🚀 Tecnologías Utilizadas

- **Node.js** (v14+)
- **Express.js**
- **MongoDB** (sin Mongoose)
- **JWT** para autenticación
- **bcrypt** para encriptación de contraseñas
- **dotenv**, **cors**, etc.

## 👥 Roles de Usuario

* 🧑‍💼 **SuperUser**: Acceso total (usuarios, productos, ventas)
* 🧑‍🔧 **Admin**: Gestión de productos y ventas
* 🛍️ **User**: Gestión de su propio carrito y compras

---

## 📁 Estructura de Endpoints

### 🔐 Autenticación

| Método | Endpoint             | Descripción                         |
| ------ | -------------------- | ----------------------------------- |
| POST   | `/api/auth/register` | Registro de nuevo usuario           |
| POST   | `/api/auth/login`    | Inicio de sesión                    |
| GET    | `/api/auth/me`       | Información del usuario autenticado |

### 👤 Usuarios (`SuperUser`)

| Método | Endpoint         | Descripción                   |
| ------ | ---------------- | ----------------------------- |
| GET    | `/api/users`     | Listar todos los usuarios     |
| GET    | `/api/users/:id` | Obtener un usuario específico |
| PUT    | `/api/users/:id` | Editar usuario                |
| DELETE | `/api/users/:id` | Eliminar usuario              |

### 🧴 Productos (`Admin`, `SuperUser`)

| Método | Endpoint            | Descripción          |
| ------ | ------------------- | -------------------- |
| GET    | `/api/products`     | Listar productos     |
| GET    | `/api/products/:id` | Detalles de producto |
| POST   | `/api/products`     | Crear producto       |
| PUT    | `/api/products/:id` | Editar producto      |
| DELETE | `/api/products/:id` | Eliminar producto    |

### 🧾 Ventas

| Método | Endpoint                | Descripción                                    |
| ------ | ----------------------- | ---------------------------------------------- |
| GET    | `/api/sales`            | Listar todas las ventas (`Admin`, `SuperUser`) |
| GET    | `/api/sales/my-sales`   | Mis ventas (`User`)                            |
| GET    | `/api/sales/:id`        | Ver detalle de venta                           |
| POST   | `/api/sales`            | Crear venta                                    |
| PUT    | `/api/sales/:id/status` | Cambiar estado de venta (`Admin`, `SuperUser`) |

### 🛒 Carrito

| Método | Endpoint                      | Descripción                 |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/cart`                   | Ver carrito del usuario     |
| POST   | `/api/cart/add`               | Agregar producto al carrito |
| PUT    | `/api/cart/update/:productId` | Cambiar cantidad            |
| DELETE | `/api/cart/remove/:productId` | Quitar producto             |
| DELETE | `/api/cart/clear`             | Vaciar carrito              |

---

## 🔐 Seguridad

* Autenticación por token **JWT**
* Contraseñas encriptadas con **bcrypt**
* Validación de roles para controlar el acceso
* Validación de datos en todas las rutas sensibles

---

## ✅ Estado del Proyecto

🚧 En desarrollo. Se planea integrar:

* Dashboard para Admin/SuperUser
* Reportes de ventas
* Mejoras en control de stock

---

## 📄 Licencia

MIT © 2025 - J\&L Clean Co.

## Seguridad de Contraseña

Las contraseñas deben cumplir con los siguientes requisitos:
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial

## Recuperación de Contraseña

### Solicitar recuperación
`POST /api/auth/forgot-password`

Body:
```
{
  "email": "usuario@ejemplo.com"
}
```
Respuesta: `{ message: 'Correo de recuperación enviado.' }`

### Restablecer contraseña
`POST /api/auth/reset-password/:token`

Body:
```
{
  "password": "NuevaContraseñaSegura1!"
}
```
Respuesta: `{ message: 'Contraseña restablecida correctamente.' }`

El enlace de recuperación se enviará al correo registrado del usuario y será válido por 1 hora.