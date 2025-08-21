# File Uploader — upload, parse, and track progress (demo inside)

This repo is a small full‑stack app that lets you upload CSV/Excel/PDF files, parses them in the background, and shows real‑time progress in the browser.

## 🎥 Demo
<video src="https://github.com/user-attachments/assets/8244f5ee-315f-47ec-a7ba-e68ea55428d6" controls width="720"></video>
---

## What’s included
- Backend: Express + MongoDB + Socket.IO
- Frontend: React (Vite) + Tailwind + Socket.IO client
- Auth: JWT (register/login)
- Uploads: CSV, Excel (xlsx/xls), PDF
- Live progress: Uploading → Processing → Uploaded (or Failed)

---

## Quick start
You’ll run backend and frontend separately.

### 1) Backend
Prereqs: Node 18+, MongoDB

```bash
cd backend
npm install
```
Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/fileparser
JWT_SECRET=replace-with-a-strong-random-secret
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE_IN_MB=100
PORT=5000
```
Start it:
```bash
npm run dev   # or: npm start
```
You should see “Server running on port 5000” and “Connected to MongoDB”.

### 2) Frontend
```bash
cd frontend
npm install
```
(Optional) Create `frontend/.env` if your backend isn’t at the default URL:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```
Start it:
```bash
npm run dev
```
Open `http://localhost:5173`.

---

## How it works (short version)
- When you upload a file, the backend stores it on disk and creates a database record with `status: uploading`.
- A background parser kicks in, updates `progress`, and emits `fileProgress` events via Socket.IO.
- When parsing finishes, the record becomes `status: ready` (shown as “Uploaded” in the UI). On errors (e.g., protected PDFs), it becomes `status: failed`.

### Limits and types
- Allowed: CSV, Excel (xlsx/xls), PDF
- Max size: configured by `MAX_FILE_SIZE_IN_MB` (default 100MB). If exceeded, the API returns a 413 like:
```json
{ "error": "File too large", "code": "LIMIT_FILE_SIZE", "maxLimitMb": 100 }
```
The frontend shows that exact limit to the user.

---

## Typical flow
1) Register or log in
2) Upload a file — you’ll see it appear with a progress bar
3) Wait for it to say “Uploaded”
4) Delete it if you don’t need it anymore

---

## Project layout
```
backend/
  server.js                # Express + Socket.IO
  routes/                  # authRoutes, fileRoutes
  middleware/auth.js       # JWT guard
  models/                  # User, File
  utils/fileParser.js      # CSV/Excel/PDF parsing + progress
  uploads/                 # Stored files (disk)

frontend/
  src/
    components/            # Navbar, FileUpload, FileList
    pages/                 # HomePage, LoginPage, RegisterPage
    context/AuthContext.jsx
    services/api.js        # axios instance + API helpers
    index.css              # Tailwind directives
  tailwind.config.js
  vite.config.js
```

---

## Troubleshooting
- “File too large”: increase `MAX_FILE_SIZE_IN_MB` in `backend/.env`. The UI will reflect the new limit from the API’s 413 response.
- Socket/CORS issues: set `FRONTEND_URL` in backend and `VITE_SOCKET_URL`/`VITE_API_URL` on the frontend so they match your environment.
- Mongo warnings about deprecated options: we removed the old driver flags; restart if you still see them.

---

## Scripts
Backend
```bash
npm run dev   # start with nodemon
npm start     # start
npm test      # backend tests (Jest + Supertest)
```
Frontend
```bash
npm run dev     # start Vite
npm run build   # production build
npm run preview # preview the build
```

---

License: MIT
