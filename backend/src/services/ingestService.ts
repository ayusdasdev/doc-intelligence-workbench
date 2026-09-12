import type { ParsedDocument } from '../types';
import { db } from '../db/db';

export async function ingestDocument(file: {
  originalname: string;
  mimetype?: string;
  path?: string;
  size?: number;
}, sessionId: string): Promise<number> {
  const now = new Date().toISOString();

  const result = db.prepare(
    `
      INSERT INTO documents (
        session_id,
        original_name,
        mime_type,
        doc_type,
        status,
        error_message,
        content_text,
        content_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    sessionId,
    file.originalname,
    file.mimetype ?? null,
    'text',
    'pending',
    null,
    '',
    null,
    now,
  );

  const docId = Number(result.lastInsertRowid);

  db.prepare(
    `
      UPDATE documents
      SET doc_type = ?,
          status = ?,
          content_text = ?,
          content_json = ?,
          error_message = ?
      WHERE id = ?
    `,
  ).run('text', 'processed', '', null, null, docId);

  return docId;
}

export function getParsedDocumentsForSession(sessionId: string): ParsedDocument[] {
  const rows = db
    .prepare(
      `
        SELECT id, session_id, original_name, mime_type, doc_type, status, error_message, content_text, content_json, created_at
        FROM documents
        WHERE session_id = ?
        ORDER BY created_at DESC
      `,
    )
    .all(sessionId) as Array<{
      id: number;
      session_id: string;
      original_name: string;
      mime_type: string | null;
      doc_type: string | null;
      status: string;
      error_message: string | null;
      content_text: string | null;
      content_json: string | null;
      created_at: string;
    }>;

  return rows.map((row) => ({
    docType: (row.doc_type === 'csv' ? 'csv' : 'text') as ParsedDocument['docType'],
    originalName: row.original_name,
    mimeType: row.mime_type ?? undefined,
    contentText: row.content_text ?? '',
    contentJson: row.content_json ? JSON.parse(row.content_json) : null,
  }));
}
