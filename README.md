# Enterprise Scalable Full-Stack Web Platform

> A production-ready, enterprise-grade full-stack platform built with Clean Architecture, Domain-Driven Modular MVC, React 18, Vite, Tailwind CSS, Redux Toolkit, Node.js, Express, Sequelize ORM, MySQL 8.0, Redis 7.0, and BullMQ.

---

## 🏛️ Architecture Overview

The system is engineered according to **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

```
[ Frontend Client (React + Vite + Tailwind) ]
                     │
                     ▼  HTTPS / REST (v1)
[ Reverse Proxy / API Gateway (Nginx) ]
                     │
                     ▼
[ Express Application Layer (Stateless) ]
    ├── Middlewares: Helmet, CORS, RateLimiter, JWT Auth, RBAC
    ├── Validators: Zod Strict Schemas
    ├── Controllers: Thin HTTP Handlers
    ├── Service Layer: Business Domain Rules & ACID Transactions
    ├── Cache Client: Redis Cache-Aside with Jitter & Fallback
    ├── Queue Producer: BullMQ Background Jobs
    └── Repository Layer: Optimized Queries & Projections
                     │
                     ▼
[ Database Layer: MySQL 8.0 with InnoDB Engine & Indexes ]
```

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (Tailored enterprise theme with custom color tokens)
- **Routing**: React Router v7 (Protected routes with RBAC RoleGuard)
- **Global State**: Redux Toolkit (Separated auth, user, notification slices)
- **Forms & Validation**: React Hook Form + Zod
- **Networking**: Centralized Axios client with automatic silent JWT token refresh
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+) & Express.js
- **Architecture**: Modular MVC + Service Layer + Repository Layer
- **ORM**: Sequelize v6 with connection pooling and MySQL dialect
- **Database**: MySQL 8.0 (InnoDB, utf8mb4, composite indexes, soft deletes)
- **Caching**: Redis 7.0 (Cache-aside pattern with automatic jitter and in-memory fallback)
- **Queues**: BullMQ distributed queue workers
- **Security**: Bcrypt (12 rounds), JWT (Access + Refresh token rotation & reuse detection), Helmet, Rate Limiting
- **Logging**: Winston structured JSON logging with sensitive data redaction
- **API Documentation**: OpenAPI / Swagger interactive documentation

---

## 📁 Repository Structure

```
kosal-task/
├── .github/workflows/ci-cd.yml      # Automated Lint, Test, Build & Docker verification
├── backend/
│   ├── database/
│   │   ├── config.js                # Sequelize CLI database config
│   │   ├── migrations/              # Versioned schema migrations
│   │   └── seeders/                 # Seeders (Roles, Permissions, Super Admin)
│   ├── src/
│   │   ├── config/                  # Database, Redis, Winston, Swagger setup
│   │   ├── constants/               # Roles, Permissions, HTTP Status Codes
│   │   ├── controllers/             # Thin HTTP transport controllers
│   │   ├── errors/                  # Centralized custom error classes
│   │   ├── events/                  # Decoupled application event bus
│   │   ├── jobs/                    # BullMQ queues & worker processes
│   │   ├── middlewares/             # JWT, RBAC, RateLimiter, Validation, Logger
│   │   ├── models/                  # Sequelize models & associations
│   │   ├── repositories/            # Encapsulated data query layer
│   │   ├── routes/                  # Versioned API routes (/api/v1)
│   │   ├── services/                # Business logic & ACID transactions
│   │   ├── utils/                   # Password hashing, JWT issuing, API response
│   │   ├── validators/              # Zod request validation schemas
│   │   ├── app.js                   # Express application assembly
│   │   └── server.js                # Bootstrapper with graceful shutdown
│   ├── tests/                       # Jest unit & Supertest API integration tests
│   └── Dockerfile                   # Multi-stage production container
├── frontend/
│   ├── src/
│   │   ├── components/common/       # Button, Loader, EmptyState, ErrorState, Toast
│   │   ├── components/forms/        # Input, Select, FormField
│   │   ├── components/tables/       # Dynamic Table, Pagination
│   │   ├── components/modals/       # Portal Modal, ConfirmDialog
│   │   ├── components/layout/       # Sidebar, Header, Breadcrumbs
│   │   ├── layouts/                 # DashboardLayout, AuthLayout
│   │   ├── pages/                   # Login, Register, Dashboard, Users, Customers
│   │   ├── routes/                  # ProtectedRoute, RoleGuard, AppRoutes
│   │   ├── services/                # Axios instance with interceptors & services
│   │   └── store/                   # Redux Toolkit store and slices
│   ├── nginx.conf                   # Production Nginx SPA routing
│   └── Dockerfile                   # Multi-stage frontend container
├── docker-compose.yml               # Multi-service stack (MySQL, Redis, Backend, Frontend)
├── .env.example                     # Environment template
└── README.md                        # Master documentation
```

---

## ⚡ Quick Start & Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **Docker & Docker Compose** for containerized execution

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Install root orchestration packages
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Environment Setup
Create environment files from templates:
```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Run Locally
You can run the backend and frontend simultaneously or independently:

```bash
# Start backend API (Port 5000)
cd backend && npm run dev

# Start frontend Vite server (Port 5173)
cd frontend && npm run dev
```

Visit the frontend in your browser at: **`http://localhost:5173`**
Visit Swagger API documentation at: **`http://localhost:5000/api/docs`**

---

## 🔑 Default Credentials

The system seeds a default Super Administrator account upon initial startup:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@enterprise.com` | `Admin@123456` |

*Note: On the login page, you can click the "Quick Demo Credentials" shortcut button to automatically populate credentials.*

---

## 🧪 Testing Suite

Execute automated unit and integration tests:

```bash
# Run backend tests (Jest + Supertest)
cd backend
npm test

# Run tests with code coverage report
npm run test:coverage
```

Test coverage includes:
- Password hashing & bcrypt verification
- JWT token issuing, verification, and rotation
- Authentication API endpoints (`/api/v1/auth/login`)
- User CRUD, pagination, and RBAC authorization guards
- Health & readiness probes

---

## 🐳 Docker Deployment

The application includes full multi-container Docker support:

```bash
# Build and run the entire stack (MySQL 8.0, Redis 7.0, Backend API, Frontend Nginx)
docker compose up --build -d

# View real-time logs
docker compose logs -f

# Stop containers
docker compose down
```

### Container Endpoints:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Swagger Docs**: `http://localhost:5000/api/docs`
- **Health Probe**: `http://localhost:5000/healthz`

---

## 🛡️ Enterprise Security Design

- **Defense in Depth**: Express security headers configured via `Helmet`.
- **RBAC**: Hierarchical roles (`SUPER_ADMIN` ➔ `ADMIN` ➔ `MANAGER` ➔ `STAFF` ➔ `CUSTOMER`).
- **Token Rotation & Reuse Detection**: Refresh tokens are single-use. If a previously revoked token is presented, the system terminates all active user sessions immediately.
- **SQL Injection Prevention**: All queries execute via Sequelize parameterized bindings.
- **Rate Limiting**: Multi-tiered protection against DDoS and brute-force authentication attacks.
- **Data Redaction**: Winston logger redacts passwords, tokens, secrets, and PII from all log outputs.
- **Error Masking**: Stack traces and SQL errors are never exposed in production HTTP responses.

---

## 📄 License
This project is licensed under the ISC License.
