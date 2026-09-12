export interface Finding {
  label: string;
  value: string;
  evidence: string;
}

export interface AnalysisResult {
  summary: string;
  findings: Finding[];
  missing_info: string[];
  discrepancy: string[];
}

export interface uploadedDoc {
  name: string;
  id: number;
}

export interface UploadResponse {
  succeeded: uploadedDoc[];
  failed: Array<{
    name: string;
    error: string;
  }>;
}

export interface AnalyzeResponse {
  fields: Record<string, string>;
  missing_info: string[];
  discrepancy: string[];
}
