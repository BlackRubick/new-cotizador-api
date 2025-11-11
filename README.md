# Cotizador API (Node + TypeScript + Express + Prisma)

Proyecto API REST para la app frontend (React + Vite). Contiene autenticación JWT, Prisma (MySQL), generación de PDFs y envío de emails.

## Requisitos
- Node.js >= 18
- MySQL instalado localmente (no Docker)

### Instalar MySQL (Ubuntu/Debian)

sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation

Crear la base de datos y usuario (ejecutar en mysql -u root -p):

CREATE DATABASE cotizador CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cotizador'@'localhost' IDENTIFIED BY 'TuPasswordFuerte';
GRANT ALL PRIVILEGES ON cotizador.* TO 'cotizador'@'localhost';
FLUSH PRIVILEGES;

## Variables de entorno
Copiar `.env.example` a `.env` y ajustar valores.

Prisma necesita una variable `DB_URL` con la cadena completa de conexión (mysql://USER:PASSWORD@HOST:PORT/DATABASE).
Tienes dos opciones:

- Opción A: definir `DB_URL` directamente en `.env`.
- Opción B (recomendada): definir las partes por separado en `.env`: `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME` y ejecutar el script auxiliar para generar `DB_URL`:

```bash
# desde la raíz del proyecto
node ./scripts/build-db-url.js
```

El script leerá las partes en `.env` y escribirá la línea `DB_URL=...` en el mismo archivo para que Prisma la use.

## Comandos

Instalar dependencias:

npm install

Generar cliente Prisma:

npx prisma generate

Crear migración y aplicar (desarrollo):

npx prisma migrate dev --name init

O desplegar migraciones en producción:

npx prisma migrate deploy

Seed de datos (admin demo):

npm run seed

Correr en desarrollo:

npm run dev

Compilar y correr:

npm run build
npm start

Tests:

npm test

## Endpoints principales

Auth: POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout

Users: CRUD en /api/users (solo admin para crear/eliminar)

Clients y Equipments: /api/clients y /api/clients/:clientId/equipments

Products: /api/products

Quotes: /api/quotes, /api/quotes/:id/pdf, /api/quotes/:id/send-email

Formato de respuesta consistente: `{ success: true, data: ... }` o `{ success: false, error: "..." }`

## Notes
- Cambia la contraseña por defecto del seed (`admin123`).
- No se implementó blacklist de refresh tokens; el refresh simple reemite JWT.
- Para PDF se usa puppeteer; en servidores sin sandbox config puede requerir ajustes.
