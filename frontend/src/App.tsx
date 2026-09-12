import React, { useMemo, useState } from 'react';
import './App.css';
import { analyze, uploadFiles } from './api';
import type { uploadedDoc } from './types';

type ResultRow = {
  id: number;
  label: string;
  type: 'Fact' | 'Inference';
  value: string;
  source: string;
};

const extractTextFromFiles = async (files: File[]): Promise<string> => {
  const parts: string[] = [];

  for (const file of files) {
    const text = await file.text().catch(() => '');
    if (text.trim()) {
      parts.push(text.trim());
    }
  }

  return parts.join('\n\n');
};

const createResultRows = (fields: Record<string, string>, summary: string): ResultRow[] => {
  const entries = Object.entries(fields ?? {});

  if (entries.length === 0) {
    return summary
      ? [{ id: 1, label: 'Summary', type: 'Fact', value: summary, source: 'System' }]
      : [];
  }

  return entries.map(([label, value], index) => {
    const isInference = /likely|may|perhaps|suggests|indicates|appears|could|seems/i.test(value);

    return {
      id: index + 1,
      label,
      type: isInference ? 'Inference' : 'Fact',
      value,
      source: summary || 'Document review',
    };
  });
};

function App() {
  const [sessionId, setSessionId] = useState('doc-session-1');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [docs, setDocs] = useState<uploadedDoc[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisFields, setAnalysisFields] = useState<Record<string, string>>({});
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const rows = useMemo(() => createResultRows(analysisFields, analysisSummary), [analysisFields, analysisSummary]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;

    if (input instanceof HTMLInputElement && input.multiple) {
      setSelectedFiles(Array.from(input.files ?? []));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setStatus('Please choose at least one document to upload.');
      return;
    }

    try {
      setStatus('Uploading documents...');
      const result = await uploadFiles(selectedFiles, sessionId);

      setDocs((prev) => [...prev, ...result.succeeded]);

      const extractedText = await extractTextFromFiles(selectedFiles);
      if (extractedText.trim()) {
        setAnalysisText(extractedText);
      }

      if (result.failed.length > 0) {
        setStatus(`Uploaded ${result.succeeded.length} document(s); ${result.failed.length} failed.`);
      } else {
        setStatus(`Uploaded ${result.succeeded.length} document(s) successfully.`);
      }

      setSelectedFiles([]);
      const fileInput = document.querySelector<HTMLInputElement>('#doc-upload');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setStatus(message);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisText.trim()) {
      setStatus('Enter text to analyze before submitting.');
      return;
    }

    try {
      setStatus('Analyzing content...');
      const result = await analyze(sessionId, analysisText);
      const fields = result.fields ?? {};
      const summary = Object.keys(fields).length
        ? `Processed ${Object.keys(fields).length} extracted field(s).`
        : 'No fields extracted from the uploaded document.';

      setAnalysisFields(fields);
      setAnalysisSummary(summary);
      setStatus('Analysis complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setStatus(message);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1200);
    } catch (error) {
      setStatus('Copy failed in this browser.');
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <header className="page-header">
          <div>
            <p className="eyebrow">Document intelligence workbench</p>
            <h1>Document analysis workspace</h1>
          </div>
        </header>

        <section className="panel">
          <div className="field-row">
            <label htmlFor="session-id">Session ID</label>
            <input
              id="session-id"
              type="text"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              placeholder="doc-session-1"
            />
          </div>

          <div className="field-row upload-row">
            <label htmlFor="doc-upload">Upload documents</label>
            <input
              id="doc-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv"
              multiple
              onChange={handleFileChange}
            />
            <button type="button" onClick={handleUpload} disabled={selectedFiles.length === 0}>
              Upload
            </button>
          </div>

          <div className="doc-list">
            {docs.length === 0 ? (
              <p className="muted">No uploaded documents yet.</p>
            ) : (
              docs.map((doc) => (
                <span key={`${doc.name}-${doc.id}`} className="doc-pill">
                  {doc.name}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="panel analysis-panel">
          <button type="button" className="primary" onClick={handleAnalyze} disabled={!analysisText.trim()}>
            Analyze
          </button>
        </section>

        {analysisSummary && (
          <section className="panel results-panel">
            <div className="results-header">
              <h2>Results</h2>
              <p className="summary">{analysisSummary}</p>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Result</th>
                    <th>Source</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className={`badge ${row.type === 'Fact' ? 'fact' : 'inference'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td>{row.value}</td>
                      <td>{row.source}</td>
                      <td>
                        <button type="button" className="copy-button" onClick={() => handleCopy(row.value)}>
                          {copied === row.value ? 'Copied' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}

export default App;
