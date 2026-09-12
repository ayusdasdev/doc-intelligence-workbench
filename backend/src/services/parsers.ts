import { parse } from 'csv-parse/sync';

import { type DocType, type DocumentInput, type ParsedDocument } from '../types';

export interface DocumentParser {
  supports(input: DocumentInput): boolean;
  parse(input: DocumentInput): ParsedDocument;
}

export function detectDocType(input: Pick<DocumentInput, 'originalName' | 'mimeType' | 'docType'>): DocType {
  if (input.docType === 'csv') {
    return 'csv';
  }

  const mime = input.mimeType?.toLowerCase() ?? '';
  const fileName = input.originalName.toLowerCase();

  if (mime.includes('csv') || fileName.endsWith('.csv')) {
    return 'csv';
  }

  return 'text';
}

export class CsvParser implements DocumentParser {
  supports(input: DocumentInput): boolean {
    return detectDocType(input) === 'csv';
  }

  parse(input: DocumentInput): ParsedDocument {
    const rows = parse(input.content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];

    return {
      docType: 'csv',
      originalName: input.originalName,
      mimeType: input.mimeType,
      contentText: input.content,
      contentJson: rows,
    };
  }
}

export class TextParser implements DocumentParser {
  supports(input: DocumentInput): boolean {
    return detectDocType(input) === 'text';
  }

  parse(input: DocumentInput): ParsedDocument {
    return {
      docType: 'text',
      originalName: input.originalName,
      mimeType: input.mimeType,
      contentText: input.content,
      contentJson: null,
    };
  }
}

export function getParserFor(input: DocumentInput): DocumentParser {
  return detectDocType(input) === 'csv' ? new CsvParser() : new TextParser();
}
