import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { upload } from './middleware/upload';
import { clearSessionUploads, ingestDocument } from './services/ingestService';
import { runAnalysis } from './services/llmService';

const router: Router = Router();

router.post('/upload', upload.array('files', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : 'default-session';
    clearSessionUploads(sessionId);

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
    const text = typeof req.body?.text === 'string' ? req.body.text : '';

    if (!text) {
      res.status(400).json({
        error: 'Missing text',
      });
      return;
    }

    const extracted = runAnalysis(text);
    const fields = Object.fromEntries(
      extracted.findings.map((finding) => [finding.label, finding.value]),
    );

    res.status(200).json({
      fields,
      missing_info: extracted.missing_info,
      discrepancy: extracted.discrepancy,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
