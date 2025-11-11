import { Router } from 'express';
import authRoutes from './auth';
import usersRoutes from './users';
import clientsRoutes from './clients';
import productsRoutes from './products';
import quotesRoutes from './quotes';
import configRoutes from './config';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/clients', clientsRoutes);
router.use('/products', productsRoutes);
router.use('/quotes', quotesRoutes);
router.use('/config', configRoutes);

export default router;
