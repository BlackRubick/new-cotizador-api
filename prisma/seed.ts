import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@local' },
    update: {},
    create: { name: 'Administrador', email: 'admin@local', password, role: 'admin', canModifyPrices: true }
  });

  const company = await prisma.company.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Empresa Demo', address: 'Calle 1', phone: '555-0000' } });

  await prisma.product.createMany({ data: [
    { sku: 'P-001', name: 'Producto A', description: 'Ejemplo A', basePrice: 100, unit: 'pcs' },
    { sku: 'P-002', name: 'Producto B', description: 'Ejemplo B', basePrice: 200, unit: 'pcs' }
  ], skipDuplicates: true });

  const client = await prisma.client.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Cliente Demo', email: 'client@local', phone: '555-1111', address: 'Calle cliente', companyId: company.id } });

  await prisma.equipment.createMany({ data: [ { clientId: client.id, equipo: 'Equipo X', marca: 'Marca', modelo: 'M1', numeroSerie: 'SN123' } ], skipDuplicates: true });

  console.log('Seed done: admin@local / admin123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
