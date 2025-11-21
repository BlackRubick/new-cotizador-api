#!/usr/bin/env node
/**
 * Script para consolidar clientes duplicados
 * Agrupa clientes con el mismo name+address y combina sus equipos
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando clientes duplicados...\n');

  // 1. Obtener todos los clientes con sus equipos
  const allClients = await prisma.client.findMany({
    include: { equipos: true }
  });

  console.log(`📊 Total de clientes en DB: ${allClients.length}`);

  // 2. Agrupar por name + address
  const clientsMap = new Map();

  allClients.forEach(client => {
    // Crear clave única: name + address (normalizado)
    const key = `${(client.name || '').trim().toUpperCase()}-${(client.address || '').trim().toUpperCase()}`;
    
    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        original: client,
        duplicates: [],
        allEquipment: [...client.equipos]
      });
    } else {
      const group = clientsMap.get(key);
      group.duplicates.push(client);
      group.allEquipment.push(...client.equipos);
    }
  });

  console.log(`🏥 Hospitales únicos: ${clientsMap.size}\n`);

  // 3. Mostrar grupos con duplicados
  let totalDuplicates = 0;
  let groupsWithDuplicates = 0;

  for (const [key, group] of clientsMap) {
    if (group.duplicates.length > 0) {
      groupsWithDuplicates++;
      totalDuplicates += group.duplicates.length;
      
      console.log(`\n📍 ${group.original.name}`);
      console.log(`   Dirección: ${group.original.address}`);
      console.log(`   Cliente principal: ID ${group.original.id} (${group.original.equipos.length} equipos)`);
      console.log(`   Duplicados: ${group.duplicates.length} clientes`);
      console.log(`   Total equipos: ${group.allEquipment.length}`);
    }
  }

  console.log(`\n📈 RESUMEN:`);
  console.log(`   - Total clientes: ${allClients.length}`);
  console.log(`   - Hospitales únicos: ${clientsMap.size}`);
  console.log(`   - Grupos con duplicados: ${groupsWithDuplicates}`);
  console.log(`   - Clientes duplicados: ${totalDuplicates}`);

  // 4. Preguntar si consolidar
  console.log(`\n⚠️  ATENCIÓN:`);
  console.log(`   Este script puede consolidar ${totalDuplicates} clientes duplicados`);
  console.log(`   en ${clientsMap.size} clientes únicos.\n`);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('¿Deseas consolidar los clientes? (yes/no): ', async (answer) => {
    readline.close();

    if (answer.toLowerCase() === 'yes') {
      console.log('\n🔄 Consolidando clientes...\n');
      
      let consolidated = 0;
      
      for (const [key, group] of clientsMap) {
        if (group.duplicates.length > 0) {
          const mainClientId = group.original.id;
          
          // Mover todos los equipos al cliente principal
          for (const duplicate of group.duplicates) {
            // Actualizar equipos para que apunten al cliente principal
            await prisma.equipment.updateMany({
              where: { clientId: duplicate.id },
              data: { clientId: mainClientId }
            });
            
            // Eliminar cliente duplicado
            await prisma.client.delete({ where: { id: duplicate.id } });
            
            consolidated++;
            console.log(`✅ Consolidado cliente ID ${duplicate.id} → ${mainClientId}`);
          }
        }
      }

      console.log(`\n✨ ¡Consolidación completada!`);
      console.log(`   - Clientes eliminados: ${consolidated}`);
      console.log(`   - Clientes restantes: ${clientsMap.size}`);
      
      // Verificar resultado
      const finalCount = await prisma.client.count();
      console.log(`   - Verificación: ${finalCount} clientes en DB\n`);
    } else {
      console.log('\n❌ Consolidación cancelada.\n');
    }

    process.exit(0);
  });
}

main().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
}).finally(() => {
  // No desconectar aquí porque readline está esperando
});
