# ERP FEEPAY — Complete Workflow Documentation

> **Source**: ERP_FEEPAY-master.zip analysis  
> **Purpose**: Reference guide for replicating all features in the student-admission-system

---

## 1. Tech Stack (ERP FEEPAY Original)

| Layer | Technology |
|---|---|
| Frontend | React 17, Material-UI v4 + v5, Redux, Apollo GraphQL, Notistack |
| Backend API | `https://feeapi.rovelabs.com` (REST + GraphQL) |
| Auth | JWT tokens |
| File Upload | AWS S3 (documents), CSV import |
| Charts | Recharts / MUI Charts |

**Our Replica Stack**: React 18 + Vite, Tailwind CSS, Lucide icons, Express + MongoDB

---

## 2. Brand & Theme

```json
{
  "navbar_background_color": "#002250",
  "navbar_items_hover_color": "#003780",
  "topbar_background_color": "#FFFFFF",
  "background": "#fafafa",
  "drawer_top_color": "#D9EAF6",
  "tabs_background": "#bbdefb",
  "tabs_indicator": "#100112"
}
```

**Status Colors**:
- Live / Active / Paid: `#2e7d32` (green)
- Pending / Warning: `#f57c00` (orange)  
- Failed / Cancelled: `#F85151` (red)
- Completed / Approved: `#1565c0` (blue)
- New / Draft: `#6d4c41` (brown)

---

## 3. Navigation Structure

```
Sidebar (dark navy #002250)
├── Dashboard
├── ADMISSIONS
│   ├── Enquiry
│   ├── Students
│   ├── Approvals
│   ├── Certificates
│   ├── Forms
│   ├── Reports
│   ├── Logs
│   └── Promote Students
├── FEE MANAGEMENT
│   ├── Fee Tracker
│   ├── Collect Fee
│   ├── Pay Records
│   ├── Transactions
│   ├── Reports
│   ├── Configuration
│   └── Logs
├── GENERAL
│   ├── Students
│   ├── Scholarship
│   ├── Bank Loan
│   ├── Reports
│   └── Logs
├── BILLING
│   ├── Customers
│   ├── Orders
│   ├── Transactions
│   ├── Pay Records
│   ├── Reports
│   └── Logs
└── CONFIGURATION
    ├── General
    ├── Academic
    ├── Onboarding
    ├── Admission
    ├── Fee Template
    ├── Users
    ├── Data
    └── Integration
```

---

## 4. Page Workflows

### 4.1 Dashboard

**URL**: `/admin/dashboard`

**Layout**: 4 KPI cards + chart row + recent students table

**KPI Cards** (from `AnalyticEcommerce` component):
1. **Total Students** — count with % rise/fall chip
2. **Total Fee Orders** — total amount due across all orders
3. **Amount Collected** — total paid amount
4. **Pending Amount** — total due - paid, with collection % chip

**Charts**:
- Bar chart: Fee collection by month
- Pie/Donut: Orders by status distribution

**Recent Students Table**: Last 10 enrolled students with USN, Name, Program, Batch, Status

---

### 4.2 Admissions → Students

**URL**: `/admin/admissions/students`

**Configurable Columns** (from `StudentHeader.json`):
```
Section: Student Details (always shown, disabled toggle)
  - USN
  - Full Name  
  - Status (pill badge)

Section: Core Details (default visible)
  - Term/Year of Study
  - Program
  - Batch

Section: Core Details (optional, toggled off by default)
  - Year of Admission
  - Quota
  - Stream
  - Categories

Section: Admission Details (optional)
  - Admission Year
  - Admission Type
```

**Views**: ListView (table) | Timeline (card grid grouped by batch)

**Toolbar**: 
- Search input
- Filter button (drawer with dropdowns)
- Columns toggle button (shows/hides optional columns)
- Mail icon (bulk email)
- WhatsApp icon (bulk message)
- Download CSV button
- + Add Student button (green)

**Status Pills**: Live (green), Completed (blue), Pending (orange), Cancelled (red)

---

### 4.3 Admissions → Enquiry

**URL**: `/admin/admissions/enquiry`

Lists all admission enquiries/schedules. Each row shows:
- Schedule name, academic year, category
- Date range
- Status badge
- Actions: View, Edit, Delete

Clicking a row → Schedule Detail page

---

### 4.4 Admissions → Approvals

**URL**: `/admin/admissions/approvals`

Lists pending admission applications. Columns:
- Applicant name, email
- Applied program
- Submission date
- Status (Pending / Approved / Rejected)
- Action buttons: Approve, Reject

---

### 4.5 Fee Management → Fee Tracker

**URL**: `/admin/fee/tracker`

**Layout**: Grid of fee schedule cards

**Each Card Shows**:
- Fee category name (heading)
- Academic year badge
- Term/Year of study
- Total orders count
- Total amount
- Collected amount + collection %
- Status badge (Active/Closed)
- Action: View Details button (navy `#002250`)

**Filters** at top: Academic Year dropdown, Fee Category dropdown, Status dropdown

Clicking a card → Fee Schedule Detail

---

### 4.6 Fee Tracker → Schedule Detail

**URL**: `/admin/fee/tracker/:id`

**Header**: Schedule name, Academic year, Fee category, Term, Status badge

**Action Buttons** (top right):
- `CREATE ORDER FROM FEE STRUCTURE` (navy filled)
- `BULK UPLOAD ORDERS` (outlined)
- `EDIT` (outlined)

**4 Tabs**:

#### Tab 1: Summary
- KPI row: Total Orders, Total Amount, Paid Amount, Pending Amount, Collection %
- Status breakdown table: Pending / Partial / Paid / Cancelled counts and amounts

#### Tab 2: Orders
**Columns**: USN | Student Name | Program | Batch | Total Amount | Paid | Due | Status | Actions

**Filters**: Status dropdown, Program dropdown, Batch dropdown

**Actions per row**:
- Eye icon → View order detail
- Record Payment button → opens collect fee modal

**Bulk actions** (when rows selected): Send reminder, Export

**`CREATE ORDER FROM FEE STRUCTURE` Modal**:
```
Title: Create Orders
Body: "Are you sure you want to create orders from fee structure 
       for all students matching this schedule's term/program?"
Buttons: Cancel | Create (navy)
```
On confirm: backend finds all Live students, matches to fee structures, 
creates FeeOrder docs, returns { created, skipped, total }

**`BULK UPLOAD ORDERS` Button** → navigates to `/admin/fee/tracker/:id/bulk-upload-orders`

#### Tab 3: Transactions
**Columns**: USN | Student | Date | Amount | Method | Reference | Status

**Filters**: Date range, Method, Status

**Export** button (CSV download)

#### Tab 4: Refunds
**Columns**: USN | Student | Date | Refund Amount | Reason | Status

---

### 4.7 Bulk Upload Orders

**URL**: `/admin/fee/tracker/:id/bulk-upload-orders`

**3-Step Wizard**:

**Step 1 — Select File**:
- Drag & drop zone (or click to browse)
- "Export Template" button → downloads CSV with headers
- Required columns: `usn, student_name, program, fee_order_amount`
- Optional: `batch, term, notes`
- Sidebar: "Things to note" with 6 fee head examples

**Step 2 — Verify Data**:
- Preview table of parsed rows
- Shows row count, error highlighting for missing required fields
- "Import X Records" button

**Step 3 — Finish**:
- Success message: "X orders created, Y skipped"
- "Go Back to Schedule" link

---

### 4.8 Collect Fee

**URL**: `/admin/fee/collect`

**Purpose**: Quick student lookup to collect fee payment

**Layout**: 
- Top filters: Academic Year, Fee Category, Status, Program, Batch
- View toggle: ListView | TimeLine
- Column toggle, Filter, Mail, WhatsApp, Download buttons
- "from X Students" count label

**ListView** (table):
- Checkboxes for bulk selection
- Columns: USN | Name | Status | Program | Batch | Fee Order Amount | Paid | Due | Payment Status
- Action per row: "Collect" button → opens payment modal

**TimeLine View** (card grid):
- Groups students by batch
- Each card: USN, Name, Status pill, amounts, Collect button

**Payment Collection Modal** (on Collect click):
```
Title: Collect Payment — [Student Name]
Fields:
  - Amount (pre-filled with due amount, editable)
  - Payment Method: Cash | Cheque | DD | PO | RTGS/NEFT | Book Adjustment
  - Transaction Reference (text)
  - Date (date picker, defaults today)
  - Remarks (optional textarea)
Buttons: Cancel | Collect Payment
```

On submit: creates FeeTransaction + updates FeeOrder paid/due amounts + status

---

### 4.9 Pay Records

**URL**: `/admin/fee/pay-records`

**Layout**: Searchable table of all payment records

**Columns**: Receipt No | Date | USN | Student Name | Program | Amount | Method | Fee Category | Actions

**Filters**: Date range, Method, Category

**Actions per row**:
- Print Receipt (opens receipt PDF/print view)
- Download receipt

**Receipt Template**:
- Institution logo + name
- Receipt number, date
- Student details (USN, name, program, batch)
- Fee category, academic year, term
- Payment breakdown table
- Method and reference
- Authorized signature block

---

### 4.10 Transactions

**URL**: `/admin/fee/transactions`

**3 Sub-tabs**: Payments | Orders | Refunds

**Payments Tab**:
- All fee transactions
- Columns: Date | USN | Student | Amount | Method | Reference | Fee Category | Status

**Orders Tab**:
- All fee orders
- Columns: USN | Student | Program | Batch | Fee Category | Total | Paid | Due | Status

**Refunds Tab**:
- All fee refunds
- Columns: Date | USN | Student | Amount | Reason | Approved By | Status

**Header Action Buttons**:
- Bulk Upload Payments → `/admin/fee/bulk-upload-payments`
- Export CSV

---

### 4.11 Bulk Upload Payments

**URL**: `/admin/fee/bulk-upload-payments`

**3-Step Wizard** (same structure as orders):

**Step 1**:
- Required columns: `usn, pay_amount, method`
- Optional: `date, reference, remarks`
- Sidebar notes:
  - Valid methods: DD, PO, CHEQUE, CASH, RTGS/NEFT, BOOK ADJUSTMENT
  - Date format: DD/MM/YYYY or YYYY-MM-DD

**Step 2**: Preview + import

**Step 3**: Success with created/skipped counts

---

### 4.12 Fee Management → Reports

**URL**: `/admin/fee/reports`

**Report Types** (tabs or cards):
1. **Collection Summary** — total collected by category/term/program
2. **Outstanding Report** — students with pending dues
3. **Student-wise Report** — per-student fee details
4. **Category-wise Report** — breakdown by fee category
5. **Method-wise Report** — payment methods distribution

**Filters**: Academic Year, Fee Category, Program, Batch, Date Range

**Export**: CSV and PDF options

---

### 4.13 Fee Configuration

**URL**: `/admin/fee/configuration`

**Sub-navigation tabs**:

#### Accounts
- Chart of Accounts setup
- GL code mapping

#### Fee Category
**Table**: Name | Description | Academic Year | Status | Actions (Edit/Delete)
**Add**: Name, Description, Academic Year fields

#### Fee Head
**Table**: Name | Category | Amount | Status | Actions
**Add**: Name, linked Fee Category, Amount, Description

#### Fee Structure
**Table**: Program | Batch | Fee Category | Total Amount | Status | Actions  
**Add**: Select Program, Batch, Category, then add fee heads with individual amounts

**Fee Structure Detail**:
```
Program: B.Tech, Batch: 2024-25, Category: Tuition Fee
┌─────────────────────┬──────────┐
│ Fee Head            │ Amount   │
├─────────────────────┼──────────┤
│ Tuition Fee         │ 50,000   │
│ Library Fee         │  2,000   │
│ Lab Fee             │  5,000   │
│ Sports Fee          │  1,500   │
├─────────────────────┼──────────┤
│ Total               │ 58,500   │
└─────────────────────┴──────────┘
```

#### Fee Schedule
**Table**: Category | Academic Year | Term | Due Date | Status | Actions
**Add**: Fee Category, Academic Year, Term, Due Date, Late Fee settings, Description

---

### 4.14 Fee Logs

**URL**: `/admin/fee/logs`

**Table**: Timestamp | Action | Entity | User | Details | IP Address

Actions logged: Order Created, Payment Collected, Refund Processed, Schedule Created, Bulk Import, etc.

---

### 4.15 General → Students

**URL**: `/admin/general/students`

Students not linked to admission process (walk-in, continuing education, etc.)

**Columns**: USN | Name | Phone | Email | Course | Status | Actions

---

### 4.16 General → Scholarship

**URL**: `/admin/general/scholarship`

**Table**: Student | USN | Scholarship Name | Amount | Awarded Date | Status

**Add Scholarship**: Select student, scholarship name, amount, sponsoring organization, notes

---

### 4.17 General → Bank Loan

**URL**: `/admin/general/bank-loan`

**Table**: Student | USN | Bank | Loan Amount | Sanction Date | Status

**Add Loan**: Select student, bank name, loan amount, sanction letter upload, notes

---

### 4.18 Billing Module

Used for non-student billing (vendors, alumni, etc.)

#### Customers
- CRUD for billing customers
- Fields: Name, Email, Phone, Address, Type

#### Orders
- Billing orders (invoice generation)
- Fields: Customer, Items, Total, Tax, Due Date, Status

#### Transactions
- Payments received against billing orders

#### Pay Records
- Receipts for billing payments

---

### 4.19 Configuration

#### General
- Institution name, logo, address, contact

#### Academic
- Programs list (add/edit/delete)
- Batches list
- Streams list

#### Onboarding
- Onboarding steps configuration

#### Admission
- Admission form fields configuration
- Required vs optional fields

#### Fee Template
- Receipt template designer
- Certificate template settings

#### Users
- User accounts (admin, staff roles)
- Role permissions

#### Data
- Import/export data
- Bulk operations

#### Integration
- Webhook configuration
- Third-party API keys

---

## 5. Key API Endpoints

### Fee Module

| Method | URL | Description |
|---|---|---|
| GET | `/api/fee/schedules` | List all fee schedules |
| POST | `/api/fee/schedules` | Create fee schedule |
| GET | `/api/fee/schedules/:id` | Get schedule detail |
| PUT | `/api/fee/schedules/:id` | Update schedule |
| POST | `/api/fee/schedules/:id/create-orders` | Generate orders from fee structures |
| POST | `/api/fee/schedules/:id/bulk-upload-orders` | CSV bulk import orders |
| GET | `/api/fee/orders` | List orders (filterable) |
| POST | `/api/fee/orders` | Create single order |
| PUT | `/api/fee/orders/:id` | Update order |
| GET | `/api/fee/transactions` | List transactions |
| POST | `/api/fee/transactions` | Record payment |
| POST | `/api/fee/transactions/bulk-upload` | CSV bulk import payments |
| GET | `/api/fee/pay-records` | List pay records |
| GET | `/api/fee/structures` | List fee structures |
| POST | `/api/fee/structures` | Create fee structure |
| GET | `/api/fee/categories` | List fee categories |
| POST | `/api/fee/categories` | Create fee category |
| GET | `/api/fee/heads` | List fee heads |
| POST | `/api/fee/heads` | Create fee head |
| GET | `/api/fee/refunds` | List refunds |
| POST | `/api/fee/refunds` | Create refund |

### Students

| Method | URL | Description |
|---|---|---|
| GET | `/api/students` | List students (paginated, filterable) |
| POST | `/api/students` | Create student |
| GET | `/api/students/:id` | Get student detail |
| PUT | `/api/students/:id` | Update student |

---

## 6. Data Models

### FeeSchedule
```
fee_category, academic_year, year_of_study (term),
due_date, late_fee_amount, late_fee_grace_days,
description, status (Active/Closed)
```

### FeeOrder
```
fee_schedule_id, academic_year, fee_category, term,
student_id, student_name, usn, program, batch,
fee_order_amount, paid_amount, due_amount,
order_status (Pending/Partial/Paid/Cancelled),
created_at
```

### FeeTransaction
```
fee_order_id, student_id, usn, student_name,
pay_amount, method (Cash/Cheque/DD/PO/RTGS-NEFT/Book-Adjustment),
reference_number, transaction_date, remarks,
fee_category, academic_year,
receipt_number, status
```

### FeeStructure
```
program, batch, fee_category,
fee_heads: [{ name, amount }],
fee_total_amount
```

### FeeCategory
```
name, description, academic_year, status
```

### FeeHead
```
name, fee_category, amount, description, status
```

---

## 7. UI Component Patterns

### Status Pills
```jsx
// Filled pill (current implementation)
const statusStyles = {
  Live:      'bg-green-500 text-white',
  Pending:   'bg-orange-400 text-white',
  Paid:      'bg-blue-500 text-white',
  Partial:   'bg-yellow-500 text-white',
  Cancelled: 'bg-red-500 text-white',
  Completed: 'bg-gray-500 text-white',
};
```

### KPI Card
```jsx
// Title (small gray) + Value (large bold) + trend chip
<div className="bg-white rounded-xl shadow p-5">
  <p className="text-sm text-gray-500">{title}</p>
  <p className="text-2xl font-bold mt-1">{value}</p>
  <p className="text-xs text-green-600 mt-1">↑ {change}%</p>
</div>
```

### Data Table
- White card with rounded-xl shadow
- Sticky header
- Zebra striping (even rows: bg-gray-50)
- Hover: bg-blue-50 cursor
- Pagination footer

### Modal
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
    {/* header, body, footer */}
  </div>
</div>
```

---

## 8. Feature Build Order (Priority)

Based on gap analysis vs current implementation:

| # | Feature | Status |
|---|---|---|
| 1 | Fee Tracker — schedule cards with KPI | ✅ Done |
| 2 | Fee Schedule Detail — 4 tabs | ✅ Done |
| 3 | Create Orders from Fee Structure | ✅ Done |
| 4 | Bulk Upload Orders (3-step wizard) | ✅ Done |
| 5 | Collect Fee — ListView/TimeLine | ✅ Done |
| 6 | Bulk Upload Payments | ✅ Done |
| 7 | **Dashboard KPI cards + charts** | 🔲 TODO |
| 8 | **Pay Records — receipt print** | 🔲 TODO |
| 9 | **Transactions — 3 sub-tabs** | 🔲 TODO |
| 10 | **Fee Configuration — all sub-tabs** | 🔲 TODO |
| 11 | **Fee Reports** | 🔲 TODO |
| 12 | **Collect Fee — payment modal** | 🔲 TODO |
| 13 | **Students — column toggle + views** | 🔲 TODO |
| 14 | **General: Scholarship, Bank Loan** | 🔲 TODO |
| 15 | **Fee Schedule Detail — Summary tab KPIs** | 🔲 TODO |
