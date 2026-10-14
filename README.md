# Employee Management System (EMS)

A full-stack HR portal for managing employees, departments, and user accounts, with role-based access control.

**Frontend:** Next.js 16 · React · TypeScript · Tailwind CSS · Recharts
**Backend:** ASP.NET Core Web API (.NET 10) · Entity Framework Core · JWT authentication
**Database:** SQL Server

<!-- Add screenshots to docs/screenshots and uncomment:
![Dashboard](docs/screenshots/dashboard.png)
![Employees](docs/screenshots/employees.png)
-->

---

## Features

| Area | Features |
|---|---|
| **Employees** | Create, view, edit, delete · auto-generated codes (`EMP001`) · validation (email, PH phone, names, hire date) · duplicate email check |
| **Search & paging** | Server-side search, filter by department/status, pagination · filters kept in the URL |
| **Profile photos** | Upload/replace/remove (JPG, PNG, WebP, max 2 MB) · avatars with initials fallback |
| **Departments** | Create, rename, delete · duplicate name check · can't delete a department that still has employees |
| **Dashboard** | Summary cards · employees per department · status breakdown · hires per month · recent hires |
| **Export** | Excel (ClosedXML) and PDF (QuestPDF), following the current search and filters |
| **Auth** | JWT stored in an httpOnly cookie · login page · logout · session-expired handling |
| **Roles** | Admin, HR, Employee, enforced by the API and reflected in the UI |
| **User management** | Admin creates users, changes roles, activates/deactivates, resets passwords · users change their own password |

### Role permissions

| Action | Admin | HR | Employee |
|---|:-:|:-:|:-:|
| View employees, departments, dashboard | ✅ | ✅ | ✅ |
| Add / edit employees, upload photos, export | ✅ | ✅ | ❌ |
| Delete employees | ✅ | ❌ | ❌ |
| Manage departments | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Change own password | ✅ | ✅ | ✅ |

---

## Architecture

```text
Browser
   │
Next.js (localhost:3000)
   ├── Server Components ──► read httpOnly cookie ──┐
   └── Client Components ──► /api/backend proxy ────┤  adds "Authorization: Bearer <token>"
                                                    ▼
ASP.NET Core Web API (localhost:5266)
   Controllers ─► Services ─► EF Core DbContext
                                                    ▼
SQL Server (EmployeeManagementDB)
```

- The browser never sees the JWT. It's kept in an **httpOnly cookie**, and Next.js attaches it when calling the API.
- Business rules (employee codes, duplicate checks, delete protection, password rules) live in the **Services** layer and are covered by unit tests.
- Unhandled errors return a consistent **ProblemDetails** JSON response.

### Project structure

```text
EmployeeManagementSystem/
├── EmployeeManagement.API/        ASP.NET Core Web API
│   ├── Controllers/               Auth, Employees, Departments, Users, Dashboard, Export
│   ├── Services/                  Business rules (EmployeeService, DepartmentService, PasswordRules, ...)
│   ├── Middleware/                GlobalExceptionHandler
│   ├── Models/ DTOs/ Data/        Entities, request models, DbContext
│   ├── Migrations/                EF Core migrations
│   └── wwwroot/uploads/           Profile photos
├── EmployeeManagement.Tests/      xUnit tests
└── employee-management-ui/        Next.js frontend
    └── src/
        ├── app/                   Pages, layouts, route handlers
        ├── components/            UI components
        ├── services/              API calls (server + client)
        ├── lib/                   Session, roles, helpers
        └── types/                 TypeScript types
```

---

## Getting started

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- SQL Server (local instance) and SSMS
- EF Core CLI: `dotnet tool install --global dotnet-ef`

### 1. Backend
```powershell
cd EmployeeManagement.API

# JWT signing key (stored outside the project, never committed)
dotnet user-secrets init
$key = "$(New-Guid)$(New-Guid)" -replace '-', ''
dotnet user-secrets set "Jwt:Key" $key

# Create the database
dotnet ef database update

dotnet run
```
The API runs at `http://localhost:5266`. Update `ConnectionStrings:DefaultConnection` in `appsettings.json` if your SQL Server isn't `localhost`.

### 2. Frontend
```powershell
cd employee-management-ui
npm install
```
Create `.env.local`:
```text
API_URL=http://localhost:5266/api
NEXT_PUBLIC_API_BASE=http://localhost:5266
```
Then:
```powershell
npm run dev
```
Open `http://localhost:3000`.

### 3. Tests
```powershell
dotnet test
```

---

## Test accounts (development only)

Created automatically the first time the API runs with an empty `Users` table.

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | Admin |
| `hr` | `Hr@12345` | HR |
| `employee` | `Employee@123` | Employee |

---

## API overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| POST | `/api/auth/change-password` | Logged in |
| GET | `/api/employees`, `/api/employees/paged`, `/api/employees/{id}` | Logged in |
| POST / PUT | `/api/employees`, `/api/employees/{id}` | Admin, HR |
| DELETE | `/api/employees/{id}` | Admin |
| POST / DELETE | `/api/employees/{id}/photo` | Admin, HR |
| GET | `/api/employees/export/excel`, `/api/employees/export/pdf` | Admin, HR |
| GET | `/api/departments` | Logged in |
| POST / PUT / DELETE | `/api/departments/...` | Admin |
| GET | `/api/dashboard/summary` | Logged in |
| GET / POST / PUT | `/api/users/...` | Admin |

---

## Possible next steps
- Leave management and attendance
- Audit log of changes
- Email notifications
- Deployment to Azure (App Service + Azure SQL) with GitHub Actions
