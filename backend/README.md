
# File Parser CRUD API (Backend)

Backend service that supports uploading CSV/Excel/PDF files, async parsing, real-time progress via Socket.IO, and CRUD over uploaded files. All file routes are JWT-protected.

## Architecture
- **Express + Socket.IO**: HTTP API with a WebSocket channel for live progress updates (`fileProgress`).
- **MongoDB (Mongoose)**: Persists users, file metadata, parsed content, and status/progress.
- **Multer (disk storage)**: Streams incoming multipart uploads to `backend/uploads/` with UUID-based filenames.
- **Async parsing**: After upload, files are parsed in the background; progress updates are persisted and emitted over Socket.IO.

### Flow
1. Client uploads a file to `POST /api/files` (JWT required).
2. Server creates a File record with `status: uploading`, `progress: 0` and saves the physical file.
3. Background task sets `status: processing` and begins parsing.
4. As parsing progresses, server updates `progress` and emits `fileProgress` events.
5. On success: `status: ready`, `progress: 100`, `parsedContent`, and `metadata` are stored.
6. On failure: `status: failed`, `error` set; event emitted.

## Project Structure (backend)
```
backend/
  server.js                    # Express app + Socket.IO, CORS, routes, errors
  routes/
    authRoutes.js              # Register, login, me
    fileRoutes.js              # Upload, list, get, progress, delete
  middleware/
    auth.js                    # JWT auth guard for /api/files
  models/
    User.js                    # User schema with password hashing
    File.js                    # File schema (status, progress, metadata, content)
  utils/
    fileParser.js              # CSV/Excel/PDF parsers + progress updates
  uploads/                     # Stored files (disk)
  __tests__/                   # Jest tests (auth/files)
```

## Requirements
- Node.js 18+
- MongoDB running locally or remotely

## Setup
1. Install deps
```bash
cd backend
npm install
```
2. Create `.env` in `backend/`:
```bash
MONGODB_URI=mongodb://localhost:27017/fileparser
JWT_SECRET=your-super-secret-and-long-jwt-secret
# Frontend URL allowed for CORS/Socket.IO (Vite default)
FRONTEND_URL=http://localhost:5173
# Upload size limit in MB (used by Multer and exposed in 413 errors)
MAX_FILE_SIZE_IN_MB=100
# Optional: PORT (defaults to 5000)
PORT=5000
```
3. Start
```bash
npm run dev   # nodemon
# or
npm start
```

## Authentication
- JWT auth; include `Authorization: Bearer <token>` for all `/api/files` endpoints.

### Endpoints
- `POST /api/auth/register`
  - Body: `{ "name": string, "email": string, "password": string }`
  - 201 → `{ message, token, user }`
- `POST /api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - 200 → `{ message, token, user }`
- `GET /api/auth/me`
  - 200 → `user` (no password field)

## Files API (JWT required)
- `POST /api/files` – Upload a file (form-data; field name `file`)
  - On success: 201 → `{ message, file: { file_id, filename, status, progress, created_at } }`
  - Triggers async parsing and progress events
  - Errors:
    - 400 unsupported type → `{ error: "Unsupported file type..." }`
    - 413 too large → `{ error: "File too large", code: "LIMIT_FILE_SIZE", maxLimitMb: <number> }`
- `GET /api/files` – List files (pagination)
  - Query: `page`, `limit`, `status`
  - 200 → `{ files: [ { id, filename, status, progress, size, metadata, created_at, updated_at } ], pagination }`
- `GET /api/files/:fileId` – Get parsed file
  - If not ready: 202 → `{ message, status, progress }`
  - If ready: 200 → `{ file_id, filename, status, metadata, content, created_at, updated_at }`
- `GET /api/files/:fileId/progress` – Current progress
  - 200 → `{ file_id, status, progress, error }`
- `DELETE /api/files/:fileId` – Delete file+record
  - 200 → `{ message, file_id }`

### Example: Upload via curl
```bash
curl -X POST http://localhost:5000/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -F file=@/path/to/data.csv
```

## Real-time Progress (Socket.IO)
- Connect to `ws://localhost:5000` (CORS allows `FRONTEND_URL`).
- Event: `fileProgress`
- Payload:
```json
{ "fileId": "uuid", "status": "uploading|processing|ready|failed", "progress": 0 }
```
- Clients should update UI when the event’s `fileId` matches their file list item.

## Parsing Behavior
- CSV: streamed with `csv-parser`; progress increments every N rows.
- Excel: `xlsx` per-sheet parsing; progress based on sheets processed.
- PDF: `pdf-parse` extracts text and info (will fail on protected PDFs).
- On success → `status: ready`, `progress: 100`, `metadata` and `parsedContent` persisted.
- On error → `status: failed`, `error` populated; event emitted. The process does not crash.

## Upload Limits & Types
- Limit: `MAX_FILE_SIZE_IN_MB` (default 100MB). 413 responses include `maxLimitMb` for client display.
- MIME types allowed:
  - `text/csv`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/vnd.ms-excel`
  - `application/pdf`

## Errors
- Standard error responses:
```json
{ "error": "message" }
```
- Size limit:
```json
{ "error": "File too large", "code": "LIMIT_FILE_SIZE", "maxLimitMb": 100 }
```
- Not found:
```json
{ "error": "File not found" }
```

## Healthcheck
- `GET /health` → `{ status: "OK", timestamp }`

## Testing
```bash
npm test
```
Uses Jest + Supertest in `backend/__tests__/`.

## Notes
- Files stored on disk at `backend/uploads/`; DB holds the path.
- Update `FRONTEND_URL` if your frontend is not on `http://localhost:5173`.
- Socket.IO origin is controlled by `FRONTEND_URL` in `server.js`.