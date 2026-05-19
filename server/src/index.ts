import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectDb } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routers';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiRouter);
app.use(errorHandler);

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
