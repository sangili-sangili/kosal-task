# Real Estate CRM – REST API Specification (v1)

> 📘 **Master Database & API Guide**: For full database table schemas, data dictionary, entity-relationship diagram (ERD), and complete API payload specifications, please refer to the comprehensive [DATABASE_AND_API_OVERVIEW.md](file:///e:/sangili/kosal-Task/docs/DATABASE_AND_API_OVERVIEW.md).

---

## Quick Endpoint Sitemap

* **Base URL:** `/api/v1`
* **Swagger Interactive Docs:** `http://localhost:5000/api/docs`
* **Health Probe:** `GET /api/v1/health`

### 1. Authentication (`/api/v1/auth`)
* `POST /login` – Staff authentication (Returns Access Token + Refresh Token)
* `POST /register` – Register staff account
* `POST /refresh-token` – Single-use rotating refresh token
* `POST /logout` – Revoke session
* `GET /me` – Current authenticated user profile

### 2. Leads Management (`/api/v1/leads`)
* `GET /` – Paginated leads list with stage & rep filters
* `POST /` – Create new prospect
* `GET /:id` – Single lead details & interaction history
* `PATCH /:id` – Update lead information
* `PATCH /:id/stage` – Advance pipeline stage (`NEW` ➔ `CONTACTED` ➔ `SITE_VISIT` ➔ `NEGOTIATION` ➔ `BOOKED` ➔ `LOST`)
* `DELETE /:id` – Soft-delete lead (Admin only)
* `POST /:id/notes` – Add prospect note
* `GET /:id/notes` – Retrieve lead notes
* `POST /:id/followups` – Schedule follow-up appointment
* `GET /:id/followups` – View scheduled follow-ups
* `PATCH /:id/followups/:followupId` – Mark follow-up completed

### 3. Property Projects & Towers (`/api/v1/projects`)
* `GET /` – List all real estate projects
* `POST /` – Create new project
* `GET /:id` – Single project details & building hierarchy
* `PATCH /:id` – Update project details
* `DELETE /:id` – Soft-delete project
* `GET /:projectId/buildings` – Get towers under specified project
* `POST /:projectId/buildings` – Add a tower/building to a project

### 4. Unit Inventory (`/api/v1/units`)
* `GET /` – Paginated inventory with BHK, price, and status filters (`AVAILABLE`, `HOLD`, `BOOKED`, `SOLD`)
* `POST /` – Add inventory unit
* `GET /:id` – Single unit specifications
* `PATCH /:id` – Update unit pricing or details
* `PATCH /:id/status` – Update inventory status
* `DELETE /:id` – Soft-delete unit

### 5. Bookings Management (`/api/v1/bookings`)
* `GET /` – List customer bookings
* `POST /` – Atomic unit reservation & token payment
* `GET /:id` – Booking receipt voucher & details
* `PATCH /:id/status` – Update booking status
* `PATCH /:id/cancel` – Cancel booking and release unit back to `AVAILABLE`

### 6. Executive Dashboard (`/api/v1/dashboard`)
* `GET /metrics` – KPIs, conversion funnel, revenue stats, and role-scoped recent activities

### 7. User & Roles Master (`/api/v1/users`)
* `GET /` – Staff user directory
* `POST /` – Create staff user
* `GET /:id` – User details
* `PUT /:id` – Update user profile & role
* `PATCH /:id/toggle-status` – Activate / Deactivate account
* `PATCH /:id/reset-password` – Admin password reset
* `DELETE /:id` – Soft-delete staff account
* `GET /roles/all` – Roles and permissions matrix
* `PUT /roles/:code/permissions` – Update role permissions

### 8. Audit Trail (`/api/v1/audit`)
* `GET /` – Paginated audit logs with search, actor, entity, and action filters (Admin only)
* `GET /stats` – Event analytics & security metrics (Admin only)
* `GET /:id` – Deep event diff inspection (Admin only)
