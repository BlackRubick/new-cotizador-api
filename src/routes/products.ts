import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// Schema de validación para productos
const productSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional().nullable(),
  basePrice: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  unit: z.string().min(1, 'Unidad es requerida'),
  imageUrl: z.string().optional().nullable(),
  metadata: z.any().optional().nullable()
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (err) { 
    next(err); 
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    
    const product = await prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    
    res.json({ success: true, data: product });
  } catch (err) { 
    next(err); 
  }
});

router.post('/', requireAuth, requireRole('admin','jefe'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = productSchema.parse(req.body);
    
    // Verificar si el SKU ya existe
    const existing = await prisma.product.findUnique({ 
      where: { sku: validated.sku } 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya existe un producto con ese SKU' 
      });
    }
    
    const product = await prisma.product.create({ data: validated });
    res.status(201).json({ success: true, data: product });
  } catch (err) { 
    next(err); 
  }
});

router.post('/batch', requireAuth, requireRole('admin','jefe'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se espera un array de productos' 
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    for (const productData of products) {
      try {
        const validated = productSchema.parse(productData);
        
        // Verificar si existe
        const existing = await prisma.product.findUnique({ 
          where: { sku: validated.sku } 
        });
        
        if (existing) {
          // Actualizar en lugar de crear
          await prisma.product.update({
            where: { id: existing.id },
            data: validated
          });
        } else {
          // Crear nuevo
          await prisma.product.create({ data: validated });
        }
        
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          sku: productData.sku,
          error: err.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      data: results 
    });
  } catch (err) { 
    next(err); 
  }
});

router.put('/:id', requireAuth, requireRole('admin','jefe'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    
    const validated = productSchema.partial().parse(req.body);
    
    // Si se está actualizando el SKU, verificar que no exista
    if (validated.sku) {
      const existing = await prisma.product.findUnique({ 
        where: { sku: validated.sku } 
      });
      
      if (existing && existing.id !== id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ya existe un producto con ese SKU' 
        });
      }
    }
    
    const product = await prisma.product.update({ 
      where: { id }, 
      data: validated 
    });
    
    res.json({ success: true, data: product });
  } catch (err) { 
    next(err); 
  }
});

router.delete('/:id', requireAuth, requireRole('admin','jefe'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) { 
    next(err); 
  }
});

export default router;
