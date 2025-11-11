import express from 'express';
import { ZodError } from 'zod';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Permite tu frontend
  credentials: true, // Permite cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', routes);

app.use((err: any, req: any, res: any, next: any) => {
  // basic error handler with Zod handling
  // eslint-disable-next-line no-console
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
  }
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Server error' });
});

export default app;
