# Document Intelligence Workbench

A lightweight document-analysis workspace that lets a user upload CSV or TXT files, review extracted information, and inspect structured findings for common document fields such as name, address, income, salary, requested loan amount, and ID number.

This project was implemented as a small full-stack demo: a React frontend for interaction, an Express API for upload and analysis, and a SQLite-backed metadata layer for session tracking and document records.

## Architecture

### High-level structure

- Frontend: React + TypeScript application in `frontend/`
- Backend: Express + TypeScript API in `backend/`
- Data persistence: SQLite database at `backend/data/workbench.db`
- File storage: upload directory at `backend/uploads` by default
- Extraction logic: regex-based field extraction and discrepancy detection in `backend/src/services/llmService.ts`
- Validation: Zod schema enforcement in `backend/src/services/analysisSchema.ts`

### Runtime flow

```mermaid
flowchart LR
    User[User] --> FE[React Frontend\nfrontend/src/App.tsx]
    FE --> API[Express API\nbackend/src/server.ts\n/backend/src/routes.ts]

    API --> Upload[/upload\naccepts multipart files]
    API --> Analyze[/analyze\naccepts raw text]

    Upload --> Ingest[ingestService\nstores file metadata]
    Ingest --> SQLite[(SQLite documents table)]
    Ingest --> UploadDir[uploads/ directory]

    Analyze --> Extract[regex extraction\nllmService.ts]
    Extract --> Validate[Zod schema validation\nanalysisSchema.ts]
    Validate --> Response[JSON response\nfields, missing_info, discrepancy]
    Response --> FE

    FE --> UI[Results table + status + copy actions]
```

## What was actually built

The implementation is intentionally pragmatic and deterministic rather than a production-grade LLM integration. The app performs the following:

1. Accepts one or more CSV/TXT files from the browser.
2. Stores basic document metadata in SQLite for the active session.
3. Saves uploaded files to a local upload directory.
4. Reads the uploaded text content from the browser and submits it to the backend analysis endpoint.
5. Extracts common structured values with regex patterns.
6. Produces a normalized response object with:
   - `summary`
   - `findings[]`
   - `missing_info[]`
   - `discrepancy[]`
7. Displays extracted fields in a table in the frontend.

## Backend design

### API endpoints

The backend exposes these endpoints under `/api`:

- `GET /health`
  - Returns a health check payload.
- `POST /upload`
  - Accepts multipart form-data with `files` and `sessionId`.
  - Clears previous uploads for the same session, stores document metadata, and returns `{ succeeded, failed }`.
- `POST /analyze`
  - Accepts `{ sessionId, text }`.
  - Runs extraction logic and responds with structured findings.

### Important implementation details

- `backend/src/server.ts`
  - Creates the Express app, enables CORS, parses JSON, mounts `/api`, and defines global error handling.
- `backend/src/routes.ts`
  - Handles upload and analysis routes.
- `backend/src/middleware/upload.ts`
  - Enforces allowed file types and sets a local upload directory.
- `backend/src/services/ingestService.ts`
  - Inserts metadata into SQLite and clears old session records.
- `backend/src/services/llmService.ts`
  - Extracts fields from text using regex. This is effectively a rule-based/mock-LM layer rather than a live AI service call.
- `backend/src/services/analysisSchema.ts`
  - Uses Zod to ensure the structured output matches a strict schema.
- `backend/src/db/db.ts`
  - Initializes the SQLite DB and schema.

## Frontend design

The React app in `frontend/src/App.tsx` provides:

- session ID entry
- multi-file upload selection
- document list display for uploaded items
- an analyze action for the extracted document text
- a result table showing fields and their values
- copy-to-clipboard action on extracted results
- status messaging for upload and analysis steps

The frontend calls the backend through `frontend/src/api.ts` using Axios.

## AI tooling and model strategy

### Current implementation

The project does not currently call Azure OpenAI, OpenAI, Gemini, or any hosted model endpoint. The “AI” layer is implemented as:

- regex-based extraction heuristics
- structured result assembly
- schema validation with Zod
- discrepancy detection based on simple numeric comparisons

This is best described as a mock LLM or rule-based intelligence layer, not a live model-backed pipeline.

### Why it is structured this way

The service file and schema are intentionally separated so a real model can be substituted later without rewriting the API contract. A future version could replace `runAnalysis()` in `backend/src/services/llmService.ts` with:

- an Azure OpenAI call
- an OpenAI responses API call
- a Gemini or other model invocation

while keeping the same output shape:

```ts
{
  summary: string,
  findings: [{ label, value, evidence }],
  missing_info: string[],
  discrepancy: string[]
}
```

## Setup

### Prerequisites

- Node.js 18+ recommended
- npm

### Install dependencies

From the workspace root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run the backend

```bash
cd backend
npm run dev
```

The API listens on port `4000` by default.

### Run the frontend

In a second terminal:

```bash
cd frontend
npm start
```

The React app runs on the default Create React App port (`3000`).

### Files and environment

The app uses a few environment variables with sensible defaults:

- `PORT` — default `4000`
- `DB_PATH` — default `backend/data/workbench.db`
- `UPLOAD_DIR` — default `./uploads` under the backend folder
- `MAX_FILE_SIZE` — default `10` MB

Example:

```bash
export PORT=4000
export DB_PATH=./data/workbench.db
export UPLOAD_DIR=./uploads
export MAX_FILE_SIZE=10
```

## Assumptions and constraints

- Only CSV and TXT files are supported.
- The upload middleware rejects unsupported MIME types and extensions.
- File content is treated as plain text. No PDF OCR, DOCX parsing, or advanced document parsing is currently implemented.
- Extraction is based on regex patterns for a narrow set of fields and is best suited to structured or semi-structured business documents.
- The database persists only metadata; raw content is not deeply indexed beyond storing text values for the session.
- The app assumes one session ID maps to a logical review set for uploads and analysis.
- The “analysis” result is a structured summary, not a full document understanding engine.

## Data model

The SQLite schema includes a `documents` table with fields such as:

- `id`
- `session_id`
- `original_name`
- `mime_type`
- `doc_type`
- `status`
- `error_message`
- `content_text`
- `content_json`
- `created_at`

This is used to keep a lightweight audit trail of uploaded documents per session.

## Testing

The project includes a schema validation test in `backend/src/services/analysisSchema.test.ts`.

Run:

```bash
cd backend
npm test -- --runInBand
```

## Notes for extension

The code is intentionally prepared for expansion into a richer AI pipeline:

- keep the same Zod schema contract
- swap the extraction engine in `llmService.ts`
- add provider-specific configuration for OpenAI/Azure/Gemini
- store extracted results alongside document metadata for later retrieval

## Summary

This repository is a small but working document-analysis demo that demonstrates:

- file upload handling
- session-scoped document tracking
- regex-based data extraction
- discrepancy detection
- structured result validation
- a React UI for review and copy actions

It is a practical baseline for a future production document intelligence workflow, but at the current stage it is a deterministic rule-based implementation rather than a hosted AI service integration.
