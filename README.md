<h1 align="center">BarberShop Booking System</h1>

![App Demo](frontend/public/screenshot-hp.png)

A full-stack appointment booking system for barbershops. Clients book services online; admins manage everything from a dashboard.

---

## Quick Start

### Option A — Docker (recommended)

```bash
cp backend/.env.example .env          # fill in JWT_SECRET
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- DB (Postgres): localhost:5432

### Option B — Local

**Prerequisites:** Node 20+, PostgreSQL running locally.

```bash
# Backend
cd backend
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env          # set VITE_API_URL if needed
npm install
npm run dev
```

---

## Environment Variables

### backend/.env

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Long random string. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | — | 5000 | HTTP port |
| `FRONTEND_URL` | — | http://localhost:5173 | Allowed CORS origin |
| `WORK_START` | — | 10:00 | Barbershop opening time (UTC, 24h) |
| `WORK_END` | — | 20:00 | Barbershop closing time (UTC, 24h) |
| `SLOT_STEP_MINUTES` | — | 15 | Slot granularity in minutes |

### frontend/.env

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | — | http://localhost:5000/api | Backend API base URL |

---

## How to create an admin user

New users register as `client` by default. To grant admin access:

```bash
cd backend
npx prisma studio
```

Open the `User` table → find your user → change `role` to `admin` → save.

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/users/otp | — | Request OTP code |
| POST | /api/users/login | — | Verify OTP, get JWT |
| GET | /api/users/me | JWT | Current user |
| PUT | /api/users/profile | JWT | Update name |
| GET | /api/shop/services | — | List services |
| GET | /api/shop/barbers | — | List barbers |
| GET | /api/shop/slots | — | Available slots |
| POST | /api/shop/appointments | JWT | Create appointment |
| GET | /api/shop/appointments | JWT | My appointments |
| PATCH | /api/shop/appointments/:id/cancel | JWT | Cancel own appointment |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/appointments | Admin | All appointments (paginated) |
| PUT | /api/admin/appointments/:id | Admin | Update status |
| GET | /api/admin/barbers | Admin | List barbers |
| POST | /api/admin/barbers | Admin | Create barber |
| PATCH | /api/admin/barbers/:id | Admin | Update barber |
| DELETE | /api/admin/barbers/:id | Admin | Delete barber |
| POST | /api/admin/services | Admin | Create service |
| PATCH | /api/admin/services/:id | Admin | Update service |
| DELETE | /api/admin/services/:id | Admin | Delete service |

---

## SMS / OTP

OTP codes are printed to the backend console in dev mode. To use a real provider (Twilio, Vonage, etc.), replace the `console.log` in `backend/src/controllers/userController.ts`:

```ts
// REPLACE WITH API REQUEST
console.log(`🔑 SMS for ${phone}: ${code}`);
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (7d) + bcrypt-hashed OTP |
| DevOps | Docker, Docker Compose, nginx |

---

## Project Structure

```
barbershop/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── controllers/
│       ├── middleware/       # auth, rateLimiter, errorHandler
│       ├── routes/
│       └── utils/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```
