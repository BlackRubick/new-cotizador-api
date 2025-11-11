import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// Helper para verificar si el usuario es admin o jefe
function requireAdminOrJefe(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'jefe')) {
    return res.status(403).json({ success: false, error: 'Forbidden: admin o jefe requerido' });
  }
  next();
}

// GET /users - Listar todos los usuarios (admin o jefe)
router.get('/', requireAuth, requireAdminOrJefe, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ 
      select: { 
        password: false, 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        canModifyPrices: true, 
        assignedCompanyId: true,
        createdAt: true,
        updatedAt: true
      } 
    });
    res.json({ success: true, data: users });
  } catch (err) { 
    next(err); 
  }
});

// POST /users - Crear usuario (admin o jefe)
router.post('/', requireAuth, requireAdminOrJefe, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, canModifyPrices, assignedCompanyId } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password es requerido' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { 
        name, 
        email, 
        password: hash, 
        role, 
        canModifyPrices: !!canModifyPrices, 
        assignedCompanyId 
      } 
    });
    
    const safe = { ...user, password: undefined } as any;
    res.json({ success: true, data: safe });
  } catch (err) { 
    next(err); 
  }
});

// GET /users/:id - Obtener usuario por ID
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    (user as any).password = undefined;
    res.json({ success: true, data: user });
  } catch (err) { 
    next(err); 
  }
});

// PUT /users/:id - Actualizar usuario
router.put('/:id', requireAuth, requireAdminOrJefe, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data: any = { ...req.body };
    
    // Si se envía password, hashearlo
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    const user = await prisma.user.update({ where: { id }, data });
    (user as any).password = undefined;
    res.json({ success: true, data: user });
  } catch (err) { 
    next(err); 
  }
});

// DELETE /users/:id - Eliminar usuario (admin o jefe)
router.delete('/:id', requireAuth, requireAdminOrJefe, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) { 
    next(err); 
  }
});

export default router;
