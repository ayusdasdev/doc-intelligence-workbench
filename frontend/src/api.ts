import axios from 'axios';

import type { AnalyzeResponse, UploadResponse } from './types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

export async function uploadFiles(files: File[], sessionId: string): Promise<UploadResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  formData.append('sessionId', sessionId);

  try {
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as { error?: string; failed?: Array<{ error?: string }> } | undefined;
      const message = payload?.error || payload?.failed?.[0]?.error || 'Unsupported file type. Please upload only CSV or TXT files.';
      throw new Error(message);
    }

    throw new Error('Unsupported file type. Please upload only CSV or TXT files.');
  }
}

export async function analyze(sessionId: string, text: string): Promise<AnalyzeResponse> {
  const response = await api.post<AnalyzeResponse>('/analyze', {
    sessionId,
    text,
  });

  return response.data;
}
