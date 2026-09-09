# Real Estate CRM – Enterprise Sales & Inventory Management Platform

> A production-ready, enterprise-grade Real Estate CRM & Property Inventory Management Platform built with Clean Architecture, Domain-Driven Modular MVC, React 18, Vite, Tailwind CSS, Redux Toolkit, Node.js, Express, Sequelize ORM, MySQL 8.0, Redis 7.0, and BullMQ.

> 📘 **Complete Flow & Tech Stack Guide**: For in-depth sequence diagrams, business lifecycle workflows, and the complete library breakdown, read [PROJECT_WORKFLOW_AND_TECH_STACK.md](file:///e:/sangili/kosal-Task/docs/PROJECT_WORKFLOW_AND_TECH_STACK.md).

---

## 🏛️ Architecture Overview

The system is engineered according to **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

```
[ Frontend Client (React 18 + Vite + Tailwind CSS + Redux Toolkit) ]
                             │
                             ▼  HTTPS / REST (v1)
[ Reverse Proxy / API Gateway (Nginx / Express Gateway) ]
                             │
                             ▼
[ Express Application Layer (Stateless Modular Monolith) ]
    ├── Middlewares: Helmet, CORS, RateLimiter, JWT Auth, RBAC
    ├── Route Guards: PermissionGuard & ProtectedRoute
    ├── Validators: Zod Strict Schemas
    ├── Controllers: Thin HTTP Handlers
    ├── Service Layer: Real Estate Domain Rules & ACID Transactions
    ├── Cache Client: Redis Cache-Aside with In-Memory Fallback
    ├── Queue Producer: BullMQ Background Notification Jobs
    └── Repository Layer: Optimized Sequelize Queries & Projections
                             │
                             ▼
[ Database Layer: MySQL 8.0 / SQLite with InnoDB Engine & Foreign Key Constraints ]
```

---

## 🏢 Core Business Modules

### 1. 🎯 Leads & Sales Pipeline Directory
* **Multi-Stage Sales Pipeline:** Track leads through `NEW` ➔ `CONTACTED` ➔ `SITE_VISIT` ➔ `NEGOTIATION` ➔ `BOOKED` ➔ `LOST`.
* **Lead Attribution:** Capture source (Website, Referral, Social Media, Walk-in), budget brackets, preferred BHK configurations, and assigned sales representatives.
* **Touchpoints & Notes:** Comprehensive interaction history with notes, calls, emails, and site-visit logs.
* **Follow-up Reminders:** Automated notification triggers for scheduled prospect follow-ups.

### 2. 🏗️ Property & Project Management
* **Projects Catalog:** Manage multi-phase residential and commercial developments (Location, Description, Launch Status).
* **Towers & Buildings:** Configure individual towers within projects (e.g., Tower A - Emerald, Tower B - Sapphire).
* **Master Planning:** Track total project units, launch dates, and construction amenities.

### 3. 🏡 Unit Inventory & Availability Matrix
* **Unit Types:** Apartments, Penthouses, Villas, Duplexes, and Studio units.
* **Configurations:** 1 BHK, 2 BHK, 3 BHK, 4 BHK, 5 BHK.
* **Specifications:** Super built-up area, carpet area, floor number, facing direction, base price, and total estimated price.
* **Inventory States:** Real-time unit lifecycle tracking across `AVAILABLE`, `HOLD`, `BOOKED`, and `SOLD`.

### 4. 📝 Bookings & Sales Execution
* **Unit Reservation:** Reserve inventory directly from lead profile or unit detail.
* **Financial Details:** Record token advance amounts, total agreement values, payment milestone schedules, and balance dues.
* **Sales Attribution:** Track which sales executive closed each booking for audit and performance metrics.

### 5. 🔔 Follow-up Notification Engine
* **Dynamic Header Alerts:** Bell icon displays overdue follow-ups, today's appointments, and fresh unattended leads.
* **Interactive Status:** Mark individual alerts as read or use "Mark all as read" directly from dropdown.
* **Read Badge Counter:** Badge updates dynamically and clearly displays a **`0`** badge count when all notifications are marked as read.
* **Client Persistence:** Unread/read status persists across browser refreshes via `localStorage`.

### 6. 📊 Executive Analytics & Funnel Dashboard
* **Sales Funnel Metrics:** Visual pipeline breakdown from total leads to site visits, active negotiations, and confirmed bookings.
* **Revenue Overview:** Total booked property values, active inventory counts, and project totals.
* **Role-Aware Live Activity Stream:** Live audit feed showing real-time CRM updates (automatically restricted to Admin roles).

### 7. 🛡️ Role-Based Access Control (RBAC) & Route Protection
* **`ADMIN`:** Full master access across all modules, User Management, Roles & Permissions, and Audit Logs.
* **`SALES` (Sales Executive / Sales Rep):** Scoped to sales operations (Leads, Projects, Units, Bookings).
* **Permission Guards:** Sales users navigating to `/audit` are prevented from accessing the page and shown an interactive **"Access Restricted"** modal popup with automatic redirection back to their current page.

### 8. 📜 Audit Trail & Security Logs
* **System Traceability:** Comprehensive audit log recording user logins, lead status changes, unit bookings, and profile modifications with timestamps and IP metadata.

---

## 🚀 Technology Stack

### Frontend
* **Framework:** React 18 with Vite
* **Styling:** Tailwind CSS (Enterprise-grade slate & brand theme)
* **Routing:** React Router v7 (Protected routes with `ProtectedRoute` & `PermissionGuard`)
* **State Management:** Redux Toolkit + Context API (`useAuth`, `usePermissions`, `useCrm`)
* **Forms & Validation:** React Hook Form + Zod validation
* **Icons:** Lucide React
* **Exporting:** Excel / CSV exports and print formatting

### Backend
* **Runtime:** Node.js (v18+) & Express.js
* **Architecture:** Modular MVC + Service Layer + Repository Layer
* **ORM:** Sequelize v6 (MySQL dialect with SQLite dev/fallback support)
* **Database:** MySQL 8.0 (InnoDB, foreign keys, UTF8mb4)
* **Caching & Queues:** Redis 7.0 & BullMQ queue workers
* **Security:** Helmet headers, CORS policies, Bcrypt password hashing, JWT Access + Refresh token rotation
* **Documentation:** OpenAPI / Swagger interactive docs (`/api/docs`)

---

## 📁 Repository Structure

```
kosal-task/
├── .github/workflows/ci-cd.yml      # CI/CD Automated Build & Verification
├── backend/
│   ├── database/
│   │   ├── config.js                # Sequelize CLI database config
│   │   ├── migrations/              # Database schema migrations
│   │   └── seeders/                 # Production seeders (Users, Projects, Units, Leads, Bookings)
│   ├── src/
│   │   ├── config/                  # Database, Redis, Winston, Swagger, Env setup
│   │   ├── constants/               # Roles (ADMIN, SALES), LeadStages, UnitStatus, Permissions
│   │   ├── controllers/             # Express HTTP transport controllers
│   │   ├── database/                # Database bootstrap & init
│   │   ├── errors/                  # Centralized custom API error classes
│   │   ├── events/                  # Decoupled application event bus
│   │   ├── jobs/                    # BullMQ queues & worker processes
│   │   ├── middlewares/             # JWT, RBAC, RateLimiter, Validation, Logger
│   │   ├── models/                  # Sequelize models (User, Role, Project, Building, Unit, Lead, Booking, AuditLog)
│   │   ├── repositories/            # Encapsulated database query layer
│   │   ├── routes/                  # Versioned API routes (/api/v1/leads, /projects, /units, /bookings, /audit...)
│   │   ├── services/                # Business domain logic & ACID transactions
│   │   ├── utils/                   # Password hashing, JWT tokens, response helpers
│   │   ├── validators/              # Zod validation schemas
│   │   ├── app.js                   # Express application configuration
│   │   └── server.js                # Bootstrapper with graceful shutdown
│   ├── tests/                       # Automated API integration tests
│   └── Dockerfile                   # Multi-stage backend container
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Button, Loader, EmptyState, Pagination
│   │   │   ├── forms/               # Form inputs, state selects
│   │   │   ├── layout/              # Sidebar, Header (notifications & profile), Breadcrumbs
│   │   │   ├── leads/               # LeadForm, stage progression components
│   │   │   ├── properties/          # AddUnitModal, Project cards
│   │   │   └── ui/                  # Input, Select, Badge, Card, Table
│   │   ├── context/                 # CrmContext
│   │   ├── hooks/                   # useAuth, usePermissions
│   │   ├── layouts/                 # DashboardLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── audit/               # AuditLogsPage (Admin restricted)
│   │   │   ├── auth/                # LoginPage, RegisterPage
│   │   │   ├── bookings/            # BookingListPage, BookingDetailPage, BookingCreatePage
│   │   │   ├── dashboard/           # DashboardPage (KPIs, Funnel, Activities)
│   │   │   ├── leads/               # LeadListPage, LeadDetailPage, LeadCreatePage, LeadEditPage
│   │   │   ├── properties/          # ProjectListPage, ProjectDetailPage
│   │   │   ├── roles/               # RoleManagementPage
│   │   │   ├── units/               # UnitListPage (Inventory matrix)
│   │   │   └── users/               # UserManagementPage
│   │   ├── routes/                  # AppRoutes, ProtectedRoute, PermissionGuard
│   │   ├── services/                # Axios API services (auth, lead, property, booking, audit, user, dashboard)
│   │   └── store/                   # Redux Toolkit store & slices (auth, user, notification)
│   ├── nginx.conf                   # Production Nginx SPA routing
│   └── Dockerfile                   # Multi-stage frontend container
├── docker-compose.yml               # Multi-service stack (MySQL, Redis, Backend, Frontend)
├── package.json                     # Root orchestration & npm workspaces
├── .env.example                     # Environment variables template
└── README.md                        # Master documentation
```

---

## ⚡ Quick Start & Development

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MySQL 8.0** *(or Docker / local SQLite fallback)*

### 2. Installation
The repository is configured with **npm workspaces**, so installing from the root directory automatically installs all root, backend, and frontend packages:

```bash
# Clone the repository
git clone <repository-url>
cd kosal-task

# Install all dependencies across the entire workspace
npm install
```

### 3. Environment Setup
Configure your environment files:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env
```

Ensure `backend/.env` points to your MySQL database credentials (e.g., `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=yourpassword`, `DB_NAME=real_estate_crm`).

### 4. Database Migration & Seeding
Initialize the database tables and populate the default Real Estate CRM data (Projects, Units, Leads, and Users):

```bash
# Run database schema migrations
npm run db:migrate

# Seed demo Real Estate CRM data
npm run db:seed
```

### 5. Run the Application
Run both backend API and frontend Vite server concurrently with a single command from the root:

```bash
# Start backend (Port 5000) and frontend (Port 5173) together
npm run dev
```

*To run services individually:*
* Backend only: `npm run dev:backend` (or `cd backend && npm run dev`)
* Frontend only: `npm run dev:frontend` (or `cd frontend && npm run dev`)

### 6. Access the Application
* **Frontend CRM Portal:** [http://localhost:5173](http://localhost:5173)
* **Backend API Base:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
* **Interactive Swagger Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **Health Check Probe:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🔑 Default Credentials

The database seeder initializes the following accounts for evaluation:

| Role | Name | Email | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@crm.com` | `Password@1234` | Full access (all modules, User & Role master, Audit trail) |
| **Sales Executive** | Rahul Sharma | `rahul.sales@crm.com` | `Password@1234` | Scoped access (Leads, Projects, Units, Bookings; Audit restricted) |
| **Sales Rep** | Anjali Verma | `anjali.sales@crm.com` | `Password@1234` | Scoped sales execution access |

> **Tip:** On the login page, you can click the quick-fill buttons to instantly populate the demo Admin or Sales Executive credentials without typing.

---

## 🛡️ Role-Based Access Control (RBAC) Details

| Feature / Page | Route | ADMIN Role | SALES Role |
| :--- | :--- | :---: | :---: |
| **Sales Dashboard** | `/dashboard` | ✅ Full (with live audit stream) | ✅ Scoped (funnel & stats; audit stream hidden) |
| **Leads Directory** | `/leads` | ✅ View / Create / Edit / Book | ✅ View / Create / Edit / Book |
| **Lead Profile** | `/leads/:id` | ✅ Full Access | ✅ Full Access |
| **Property Projects** | `/properties` | ✅ View / Create / Edit | ✅ View Projects |
| **Units Inventory** | `/units` | ✅ Manage & Add Units | ✅ View & Filter Inventory |
| **Bookings** | `/bookings` | ✅ View & Manage All | ✅ View & Create Bookings |
| **User Management** | `/users` | ✅ Full User Admin | ❌ Restricted |
| **Roles Master** | `/roles` | ✅ Configure Permissions | ❌ Restricted |
| **Audit Logs** | `/audit` | ✅ Full Audit Trail Inspection | ❌ **Restricted** (triggers popup modal & redirect) |

---

## 🐳 Docker Deployment

To launch the complete containerized stack (MySQL 8.0, Redis 7.0, Express API, and Nginx Frontend):

```bash
# Build and start all services in detached mode
docker compose up --build -d

# Check running services
docker compose ps

# View container logs
docker compose logs -f

# Stop and tear down containers
docker compose down
```

### Container Endpoints:
* **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **Health Probe:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 📄 License
This project is licensed under the ISC License.
