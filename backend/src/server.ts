import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';

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

app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
