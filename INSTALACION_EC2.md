# 🚀 Guía de Instalación en EC2

Esta guía te ayudará a configurar y desplegar la API del Cotizador en tu servidor EC2.

## 📋 Prerequisitos

### 1. Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js (versión 18 LTS)
```bash
# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar configuración del shell
source ~/.bashrc

# Instalar Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version
```

### 3. Instalar MySQL
```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Iniciar y habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar estado
sudo systemctl status mysql
```

### 4. Configurar MySQL de forma segura
```bash
sudo mysql_secure_installation
```

Responde a las preguntas:
- Set root password? **Y** (elige una contraseña segura)
- Remove anonymous users? **Y**
- Disallow root login remotely? **Y**
- Remove test database? **Y**
- Reload privilege tables? **Y**

### 5. Crear Base de Datos y Usuario
```bash
# Entrar a MySQL como root
sudo mysql -u root -p
```

Dentro de MySQL, ejecuta:
```sql
-- Crear la base de datos
CREATE DATABASE cotizador CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (CAMBIA 'TuPasswordFuerte' por una contraseña segura)
CREATE USER 'cotizador'@'localhost' IDENTIFIED BY 'TuPasswordFuerte';

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON cotizador.* TO 'cotizador'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User='cotizador';

-- Salir
EXIT;
```

### 6. Instalar PM2 (Process Manager)
```bash
npm install -g pm2
```

## 🔧 Configuración del Proyecto

### 1. Navegar al directorio del proyecto
```bash
cd /ruta/donde/clonaste/new-api-cotizador
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env
nano .env
```

**Variables IMPORTANTES a configurar:**
```env
# Puerto donde correrá la API
PORT=4000

# Ambiente de producción
NODE_ENV=production

# URL de tu frontend (tu IP pública)
FRONTEND_URL=http://3.17.72.208

# Base de datos (ajusta la contraseña que creaste)
DB_URL=mysql://cotizador:TuPasswordFuerte@localhost:3306/cotizador

# Secretos JWT (CAMBIAR por valores únicos y seguros)
JWT_SECRET=genera-un-string-aleatorio-muy-largo-aqui-123456789
JWT_REFRESH_SECRET=genera-otro-string-aleatorio-diferente-987654321

# URL de la API (para generar PDFs)
API_URL=http://localhost:4000

# Email (opcional, para enviar cotizaciones)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu-email@gmail.com
# SMTP_PASS=tu-password-de-aplicacion
# EMAIL_FROM=tu-email@gmail.com
```

Guarda con `Ctrl + O`, Enter, y sal con `Ctrl + X`.

### 4. Configurar Prisma y Base de Datos
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones (crear tablas)
npx prisma migrate deploy

# Verificar que las tablas se crearon
sudo mysql -u root -p cotizador -e "SHOW TABLES;"
```

### 5. Crear usuario administrador inicial
```bash
npm run seed
```

Esto creará un usuario admin con:
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ IMPORTANTE: Cambia esta contraseña después del primer login!**

### 6. Compilar el proyecto
```bash
npm run build
```

## 🚀 Despliegue

### Opción 1: Usar PM2 (Recomendado)
```bash
# Iniciar la aplicación con PM2
pm2 start npm --name "cotizador-api" -- start

# Ver el estado
pm2 status

# Ver logs en tiempo real
pm2 logs cotizador-api

# Hacer que PM2 se inicie con el sistema
pm2 startup
pm2 save
```

**Comandos útiles de PM2:**
```bash
pm2 restart cotizador-api  # Reiniciar la app
pm2 stop cotizador-api     # Detener la app
pm2 delete cotizador-api   # Eliminar la app de PM2
pm2 logs cotizador-api     # Ver logs
pm2 monit                  # Monitor en tiempo real
```

### Opción 2: Correr directamente (solo para pruebas)
```bash
npm start
```

## 🔒 Configurar Firewall (Security Groups en AWS)

En tu consola de AWS EC2, configura los Security Groups para permitir:

1. **Puerto 4000** - Para la API
   - Type: Custom TCP
   - Port: 4000
   - Source: 0.0.0.0/0 (o restringe a IPs específicas)

2. **Puerto 22** - SSH (si aún no está)
   - Type: SSH
   - Port: 22
   - Source: Tu IP

3. **Puerto 80/443** - HTTP/HTTPS (si usarás NGINX)
   - Type: HTTP/HTTPS
   - Port: 80/443
   - Source: 0.0.0.0/0

## ✅ Verificar la Instalación

### 1. Verificar que la API está corriendo
```bash
curl http://localhost:4000/api/auth/login
```

Deberías ver una respuesta JSON.

### 2. Probar desde tu navegador
Abre: `http://TU-IP-PUBLICA-EC2:4000/api/auth/login`

### 3. Verificar logs
```bash
pm2 logs cotizador-api
```

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:
```bash
# 1. Ir al directorio del proyecto
cd /ruta/proyecto

# 2. Descargar últimos cambios (si usas git)
git pull

# 3. Instalar nuevas dependencias (si hay)
npm install

# 4. Recompilar
npm run build

# 5. Reiniciar con PM2
pm2 restart cotizador-api
```

## 🐛 Solución de Problemas

### La API no arranca
```bash
# Ver logs detallados
pm2 logs cotizador-api --lines 100

# Ver errores de Node
node dist/index.js
```

### Error de conexión a MySQL
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Probar conexión manual
mysql -u cotizador -p cotizador
```

### Error "Cannot find module"
```bash
# Regenerar módulos de Prisma
npx prisma generate

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Puerto 4000 ya en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :4000

# Matar el proceso (reemplaza PID con el número que viste)
kill -9 PID
```

## 📝 Notas Importantes

1. **Seguridad:**
   - Cambia los secretos JWT a valores únicos y seguros
   - Cambia la contraseña del admin después del primer login
   - No expongas el puerto 3306 de MySQL al exterior
   - Mantén tu sistema actualizado

2. **Backups:**
   - Haz backups regulares de tu base de datos:
   ```bash
   mysqldump -u cotizador -p cotizador > backup_$(date +%Y%m%d).sql
   ```

3. **Monitoreo:**
   - Revisa los logs regularmente con `pm2 logs`
   - Configura alertas si el servicio se cae

4. **Performance:**
   - Si tienes alto tráfico, considera usar NGINX como reverse proxy
   - Configura variables de entorno de Node para producción

## 🆘 Contacto

Si tienes problemas, verifica:
1. Logs de PM2: `pm2 logs cotizador-api`
2. Estado de MySQL: `sudo systemctl status mysql`
3. Variables de entorno en `.env`
4. Security Groups en AWS

---

**¡Tu API debería estar funcionando en `http://TU-IP-EC2:4000`!** 🎉
