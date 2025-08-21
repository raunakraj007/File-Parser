
# File Uploader Frontend (React + Vite)

A React UI for uploading CSV/Excel/PDF files, tracking real-time progress, and managing uploaded files. Built with Vite, Tailwind CSS, and Socket.IO.

## Features
- JWT auth (login/register) with token persisted in localStorage
- Upload files and see live progress updates via Socket.IO
- List, delete, and view status of uploaded files
- Friendly status labels (Uploading…, Processing…, Uploaded, Failed)
- Handles oversize uploads with a clear error including the configured max limit

## Tech
- React 19 + Vite 7
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Axios for API calls
- Socket.IO client for real-time updates
- React Router for routing

## Prerequisites
- Backend running at `http://localhost:5000` (or set `VITE_API_URL`)
- Node.js 18+

## Setup
```bash
cd frontend
npm install
npm run dev
```

## App Structure
```
src/
  components/
    Navbar.jsx        # Top nav; shows Login/Register or Logout
    FileUpload.jsx    # Upload control with inline errors
    FileList.jsx      # List with status + progress bar + delete
  pages/
    HomePage.jsx      # Uploader + list
    LoginPage.jsx     # Login form
    RegisterPage.jsx  # Registration form
  context/
    AuthContext.jsx   # JWT auth context (login/register/me)
  services/
    api.js            # axios instance + auth/file helpers
  App.jsx             # Routes and route-guard
  main.jsx            # App entry
  index.css           # Tailwind directives
```

## How It Works
- On login/register, token is stored in localStorage; `AuthContext` boots with `/auth/me` when token exists.
- Upload uses `POST /api/files` with `multipart/form-data` (`file` field).
- After upload, backend parses async and emits `fileProgress` events; `FileList` listens and updates items.
- Oversized files return 413 with `{ error, code: 'LIMIT_FILE_SIZE', maxLimitMb }`; UI shows the exact limit.

## API Endpoints Used
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/files`
- GET `/api/files`
- GET `/api/files/:fileId`
- GET `/api/files/:fileId/progress`
- DELETE `/api/files/:fileId`

## Notes
- Max upload size is configured on the backend via `MAX_FILE_SIZE_IN_MB`; the value is shown in UI on 413.
