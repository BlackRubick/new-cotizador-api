#!/bin/bash

# 🚀 Script de Instalación Rápida para EC2
# Este script instala y configura la API del Cotizador

set -e  # Salir si hay algún error

echo "=================================="
echo "🚀 Instalador API Cotizador"
echo "=================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Error: No se encuentra package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

print_success "Directorio correcto detectado"

# 1. Verificar Node.js
echo ""
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js instalado: $NODE_VERSION"

# 2. Verificar MySQL
echo ""
print_info "Verificando MySQL..."
if ! command -v mysql &> /dev/null; then
    print_error "MySQL no está instalado. Por favor instala MySQL primero."
    exit 1
fi
print_success "MySQL instalado"

# 3. Instalar dependencias
echo ""
print_info "Instalando dependencias de npm..."
npm install
print_success "Dependencias instaladas"

# 4. Verificar archivo .env
echo ""
if [ ! -f ".env" ]; then
    print_info "No se encontró archivo .env, creando desde .env.example..."
    cp .env.example .env
    print_success "Archivo .env creado"
    echo ""
    print_info "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales:"
    print_info "   - DB_URL (usuario y contraseña de MySQL)"
    print_info "   - JWT_SECRET y JWT_REFRESH_SECRET"
    print_info "   - FRONTEND_URL (ya configurada: http://3.17.72.208)"
    echo ""
    read -p "Presiona Enter cuando hayas editado el archivo .env..."
else
    print_success "Archivo .env encontrado"
fi

# 5. Generar cliente de Prisma
echo ""
print_info "Generando cliente de Prisma..."
npx prisma generate
print_success "Cliente de Prisma generado"

# 6. Ejecutar migraciones
echo ""
print_info "Ejecutando migraciones de base de datos..."
echo ""
read -p "¿Ya creaste la base de datos 'cotizador' en MySQL? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Por favor crea la base de datos primero:"
    echo ""
    echo "sudo mysql -u root -p"
    echo "CREATE DATABASE cotizador CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "CREATE USER 'cotizador'@'localhost' IDENTIFIED BY 'TuPasswordFuerte';"
    echo "GRANT ALL PRIVILEGES ON cotizador.* TO 'cotizador'@'localhost';"
    echo "FLUSH PRIVILEGES;"
    echo "EXIT;"
    echo ""
    exit 1
fi

npx prisma migrate deploy
print_success "Migraciones aplicadas"

# 7. Seed de datos (usuario admin)
echo ""
read -p "¿Quieres crear un usuario administrador de prueba? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Creando usuario administrador..."
    npm run seed
    print_success "Usuario admin creado (admin@example.com / admin123)"
fi

# 8. Compilar proyecto
echo ""
print_info "Compilando proyecto TypeScript..."
npm run build
print_success "Proyecto compilado"

# 9. Verificar PM2
echo ""
if ! command -v pm2 &> /dev/null; then
    print_info "PM2 no está instalado. ¿Quieres instalarlo globalmente? (Recomendado)"
    read -p "(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g pm2
        print_success "PM2 instalado"
    fi
fi

# 10. Preguntar si iniciar con PM2
echo ""
echo "=================================="
print_success "¡Instalación completada!"
echo "=================================="
echo ""
print_info "Para iniciar la aplicación, tienes dos opciones:"
echo ""
echo "1. Con PM2 (recomendado para producción):"
echo "   pm2 start npm --name 'cotizador-api' -- start"
echo "   pm2 logs cotizador-api"
echo ""
echo "2. Modo normal (solo para pruebas):"
echo "   npm start"
echo ""

if command -v pm2 &> /dev/null; then
    read -p "¿Quieres iniciar la aplicación con PM2 ahora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Iniciando aplicación con PM2..."
        pm2 start npm --name "cotizador-api" -- start
        pm2 save
        echo ""
        print_success "¡Aplicación iniciada!"
        echo ""
        print_info "Comandos útiles:"
        echo "  pm2 status                    - Ver estado"
        echo "  pm2 logs cotizador-api       - Ver logs"
        echo "  pm2 restart cotizador-api    - Reiniciar"
        echo "  pm2 stop cotizador-api       - Detener"
        echo ""
        print_info "Prueba la API en: http://localhost:4000"
    fi
fi

echo ""
print_info "📖 Lee INSTALACION_EC2.md para más información"
echo ""
