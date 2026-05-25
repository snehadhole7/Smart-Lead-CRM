# Backend

This folder contains a working Node.js backend for the CRM, including Express APIs, JWT auth, and MongoDB integration.

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, `JWT_SECRET`, and `PORT`.
3. Install dependencies:
   - `cd backend`
   - `npm install`
4. Start the API server:
   - `npm run dev`

## API Endpoints
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/reports/summary`

## Notes
- The backend uses MongoDB with Mongoose.
- If you want the old C++ skeleton, it remains in `backend/src/` and `CMakeLists.txt`.
