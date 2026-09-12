export type DocType = 'csv' | 'text';

export interface ParsedDocument {
  docType: DocType;
  originalName: string;
  mimeType?: string;
  contentText: string;
  contentJson: Record<string, unknown>[] | Record<string, unknown> | null;
}

export interface DocumentInput {
  originalName: string;
  mimeType?: string;
  docType?: DocType;
  content: string;
}
