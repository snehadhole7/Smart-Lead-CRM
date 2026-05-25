# Smart Lead & Customer Management System

This workspace contains a starter project for a CRM with a React frontend and a placeholder C++ backend.

## Frontend
- Technology: React + Vite
- Open locally at: `http://localhost:5173`

## Backend
- Technology: C++ (Crow-style skeleton)
- Placeholder API server structure

## How to run
1. Open the workspace in VS Code.
2. In one terminal, run:
   - `cd backend`
   - `npm install`
   - copy `.env.example` to `.env`
   - `npm run dev`
3. In another terminal, run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open `http://localhost:5173` in your browser.

## Notes
- The backend includes Express APIs, MongoDB integration, JWT auth, and lead/customer routes.
- The frontend is a React app with login, dashboard, lead forms, customer details, and reports.
- A plain HTML/CSS/JavaScript website is also available in the `website/` folder.
- To use the static website, open `website/index.html` in a browser and ensure the backend is running at `http://127.0.0.1:4000`.
- Use `frontend/.env` to configure the React app API base URL if needed.
