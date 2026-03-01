# E-Commerce Store

Full-stack e-commerce platform with OTP authentication, Razorpay payments, delivery radius calculation, and admin dashboard.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Razorpay
- **Auth**: JWT with httpOnly cookies
- **Deployment**: Docker, Nginx, PM2

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### 1. Clone and Install
```bash
git clone <repo-url>
cd ecommerce-store
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup
```bash
# Using Docker (recommended)
docker-compose up -d postgres

# Or use local PostgreSQL
# Update DATABASE_URL in .env
```

### 4. Initialize Database
```bash
npm run setup
```

### 5. Start Development
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: http://localhost:5555

## Project Structure

```
ecommerce-store/
├── backend/           # Express API
│   ├── prisma/       # Database schema & migrations
│   ├── src/          # Source code
│   └── uploads/      # File uploads
├── frontend/         # Next.js frontend
│   ├── src/          # Source code
│   └── public/       # Static assets
└── docker-compose.yml
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with sample data |
| `npm run build` | Build for production |
| `npm run lint` | Run linting |

## API Documentation

See `/backend/src/routes.ts` for all available endpoints.

### Main Routes

| Route | Description |
|-------|-------------|
| `POST /api/v1/auth/send-otp` | Send OTP to phone |
| `POST /api/v1/auth/verify-otp` | Verify OTP and login |
| `GET /api/v1/products` | List products (paginated) |
| `POST /api/v1/cart/validate` | Validate cart items |
| `POST /api/v1/delivery/check` | Check delivery eligibility |
| `POST /api/v1/orders` | Create order |
| `GET /api/v1/admin/dashboard` | Admin dashboard stats |

## Features

- **OTP Authentication**: Phone-based login, no passwords
- **Dynamic Forms**: Form fields controlled from backend
- **Delivery Radius**: Haversine-based distance calculation
- **Payments**: COD + Razorpay integration
- **Admin Panel**: Dashboard, order management, analytics
- **Coupons**: Discount system
- **Audit Logs**: Track admin actions

## Deployment

See `DEPLOYMENT.md` for VPS setup instructions.

## License

MIT
