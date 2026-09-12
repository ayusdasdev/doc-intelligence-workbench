import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { upload } from './middleware/upload';
import { ingestDocument } from './services/ingestService';
import { runAnalysis } from './services/llmService';

const router: Router = Router();

router.post('/upload', upload.array('files', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : 'default-session';
    const succeeded: Array<{ name: string; id: number }> = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const file of files) {
      if (!file || typeof file.originalname !== 'string') {
        continue;
      }

      try {
        const documentId = await ingestDocument(file, sessionId);
        succeeded.push({ name: file.originalname, id: documentId });
      } catch (error) {
        failed.push({
          name: file.originalname,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    res.status(files.length > 0 ? 200 : 400).json({
      succeeded,
      failed,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
    const text = typeof req.body?.text === 'string' ? req.body.text : '';

    if (!sessionId || !text) {
      res.status(400).json({
        succeeded: [],
        failed: [{ sessionId, error: 'Missing sessionId or text' }],
      });
      return;
    }

    const result = runAnalysis(text);

    res.status(200).json({
      succeeded: [{ sessionId, summary: result.summary }],
      failed: [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
