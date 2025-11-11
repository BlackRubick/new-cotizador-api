import { Router, Request, Response } from 'express';

const router = Router();

router.get('/roles', (req: Request, res: Response) => {
  res.json({ success: true, data: ['admin', 'jefe', 'vendedor'] });
});

export default router;
