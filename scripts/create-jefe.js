#!/usr/bin/env node
/* script to create a 'jefe' user via Prisma
   Usage: node ./scripts/create-jefe.js
   It will upsert a user with email jefe@local and password 'jefe123' (change as needed)
*/

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordPlain = process.env.JEFE_PASSWORD || 'jefe123';
  const hashed = await bcrypt.hash(passwordPlain, 10);
  // make sure company with id 1 exists or adjust as needed
  const company = await prisma.company.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Empresa Demo', address: 'Calle 1', phone: '555-0000' } });

  const user = await prisma.user.upsert({
    where: { email: 'jefe@gmail.com' },
    update: { name: 'Jefe', password: hashed, role: 'jefe', assignedCompanyId: company.id },
    create: { name: 'Jefe', email: 'jefe@gmail.com', password: hashed, role: 'jefe', canModifyPrices: true, assignedCompanyId: company.id }
  });

  console.log("Jefe usuario creado/actualizado:", { id: user.id, email: user.email, role: user.role });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
