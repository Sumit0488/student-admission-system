# Student Admission Management System

A full-stack ERP-style admission management system built with GraphQL, React, and MongoDB.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Node.js, Express, Apollo Server 4 (GraphQL)     |
| Database | MongoDB (Mongoose ODM)                          |
| Validation | Joi                                           |
| Frontend | React 18, Vite, Apollo Client, Tailwind CSS     |
| Routing  | React Router v6                                 |

---

## Project Structure

```
student Admission System/
├── backend/
│   ├── schema/               # student.schema.yaml (entity definition)
│   └── src/
│       ├── app.js            # Express + Apollo Server entry point
│       ├── config/db.js      # MongoDB connection
│       ├── models/           # Mongoose models
│       ├── services/         # Business logic layer
│       ├── graphql/
│       │   ├── typeDefs/     # GraphQL SDL schema
│       │   └── resolvers/    # GraphQL resolvers
│       └── utils/            # Validators, error handlers
└── frontend/
    └── src/
        ├── components/       # Reusable UI components
        ├── pages/            # Route-level page components
        ├── services/         # GraphQL query/mutation documents
        └── hooks/            # Custom Apollo hooks
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend Setup

```bash
cd backend
npm install
# Copy and edit env if needed
cp .env.example .env
npm run dev
```

The GraphQL API will be available at: `http://localhost:4000/graphql`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## GraphQL API

### Queries

| Query | Description |
|-------|-------------|
| `listStudents(page, limit, filters)` | Paginated list with search & filters |
| `getStudent(id)` | Fetch single student by MongoDB ID |
| `getStudentByStudentId(student_id)` | Fetch by external ID (e.g. STU-ABC-123) |
| `countStudents(filters)` | Count matching students |

### Mutations

| Mutation | Description |
|----------|-------------|
| `createStudent(input)` | Create a new student record |
| `updateStudent(id, input)` | Update student details |
| `deleteStudent(id)` | Soft-delete (sets isDeleted=true) |
| `restoreStudent(id)` | Restore a soft-deleted student |
| `changeAdmissionStatus(student_id, status)` | Change status with transition validation |

### Admission Status Transitions

```
APPLIED → APPROVED → ENROLLED
APPLIED → REJECTED → APPLIED
APPROVED → REJECTED
```

---

## Features

- **CRUD Operations** — Create, Read, Update, soft-delete and restore students
- **Search** — Full-text search by name, email, program, student ID
- **Filtering** — Filter by status, program, department, batch
- **Pagination** — Server-side pagination with configurable page size
- **Validation** — Joi validation on backend + form validation on frontend
- **Status Transitions** — Enforced valid status changes with clear error messages
- **Duplicate Detection** — Prevents duplicate email registrations
- **Error Handling** — Consistent GraphQL error codes and messages
