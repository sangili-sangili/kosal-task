# REST API Specification (v1)

Base URL: `/api/v1`

All responses follow the JSend-compliant standard format:

```json
{
  "success": true,
  "message": "Operation status description",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Access**: Public (Rate-limited: 10 requests / 15m)
- **Body**:
  ```json
  {
    "email": "admin@enterprise.com",
    "password": "Admin@123456"
  }
  ```
- **Returns**: User object, Access Token (15m expiration), Refresh Token (7-day expiration).

### `POST /api/v1/auth/register`
- **Access**: Public
- **Body**: `{ firstName, lastName, email, password, phone }`

### `POST /api/v1/auth/refresh-token`
- **Access**: Public
- **Body**: `{ "refreshToken": "<token>" }`
- **Behavior**: Single-use token rotation. Detects reuse attacks and immediately revokes all user sessions upon breach attempt.

### `POST /api/v1/auth/logout`
- **Access**: Public
- **Body**: `{ "refreshToken": "<token>" }`

### `GET /api/v1/auth/me`
- **Access**: Private (Bearer JWT)

---

## 2. User Management Endpoints

### `GET /api/v1/users`
- **Access**: Private (`SUPER_ADMIN`, `ADMIN`, `MANAGER`)
- **Query Parameters**:
  - `page`: Integer (Default: 1)
  - `limit`: Integer (Default: 20)
  - `search`: String (Searches firstName, lastName, email)
  - `status`: `ACTIVE` | `INACTIVE` | `SUSPENDED`
  - `sortBy`: `createdAt` | `firstName` | `email`
  - `sortOrder`: `ASC` | `DESC`

### `POST /api/v1/users`
- **Access**: Private (`SUPER_ADMIN`, `ADMIN`)
- **Body**: `{ firstName, lastName, email, password, phone, roleId, status }`

### `PUT /api/v1/users/:id`
- **Access**: Private (`SUPER_ADMIN`, `ADMIN`)

### `DELETE /api/v1/users/:id`
- **Access**: Private (`SUPER_ADMIN`, `ADMIN`)
- **Behavior**: Paranoid soft delete (`deleted_at` timestamp set, row preserved for audit).

---

## 3. Customer & Transaction Showcase Endpoints

### `GET /api/v1/customers`
- **Access**: Private

### `POST /api/v1/customers/transaction-demo`
- **Access**: Private
- **Body**:
  ```json
  {
    "customer": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@enterprise.com",
      "phone": "+1-555-0144",
      "company": "Global Corp"
    },
    "account": {
      "accountType": "CHECKING",
      "initialDeposit": 2500.00,
      "currency": "USD"
    }
  }
  ```
- **Behavior**: Executes managed Sequelize atomic transaction across Customers, Accounts, and AuditLogs.
