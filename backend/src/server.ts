import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';

import router from './routes';
import { initSchema } from './db/db';

const app = express();
const port = Number(process.env.PORT ?? 4000);

initSchema();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});

app.use('/api', router);

app.use((err: Error & { statusCode?: number; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode =
    typeof err?.statusCode === 'number'
      ? err.statusCode
      : typeof err?.status === 'number'
        ? err.status
        : 500;

  const message = typeof err?.message === 'string' && err.message.trim().length > 0
    ? err.message
    : 'Internal Server Error';

  const normalizedMessage = statusCode === 400 || /unsupported|only csv|only txt|file type/i.test(message)
    ? 'Unsupported file type. Please upload only CSV or TXT files.'
    : message;

  res.status(statusCode).json({
    error: normalizedMessage,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
