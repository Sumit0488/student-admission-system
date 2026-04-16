# ERP FEEPAY — Complete Master Documentation

> This document covers every feature, page, workflow, UI component, backend API pattern, and data flow in the ERP_FEEPAY-master codebase. Written for the purpose of building an identical replica in the existing student-admission-system.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Theme & Brand Identity](#3-theme--brand-identity)
4. [Authentication](#4-authentication)
5. [Global Context Providers](#5-global-context-providers)
6. [Navigation & Routing](#6-navigation--routing)
7. [UI Component Library](#7-ui-component-library)
8. [Feature Modules — Frontend & Backend](#8-feature-modules)
   - 8.1 [Dashboard](#81-dashboard)
   - 8.2 [Fee Setup](#82-fee-setup)
   - 8.3 [Schedule (Fee Schedules)](#83-schedule-fee-schedules)
   - 8.4 [Collect Fee](#84-collect-fee)
   - 8.5 [Transactions](#85-transactions)
   - 8.6 [Transactions New](#86-transactions-new)
   - 8.7 [Scholarship](#87-scholarship)
   - 8.8 [Accounts / RTGS-NEFT](#88-accounts--rtgs-neft)
   - 8.9 [Reports](#89-reports)
   - 8.10 [Student Fee (Student View)](#810-student-fee-student-view)
   - 8.11 [All Students](#811-all-students)
   - 8.12 [Institution Setup](#812-institution-setup)
   - 8.13 [User Management](#813-user-management)
   - 8.14 [Reminders](#814-reminders)
   - 8.15 [Message Logs](#815-message-logs)
   - 8.16 [Billing Transactions](#816-billing-transactions)
   - 8.17 [Admission List & Approvals](#817-admission-list--approvals)
   - 8.18 [Promote Students](#818-promote-students)
9. [Invoice System](#9-invoice-system)
10. [Document Upload System](#10-document-upload-system)
11. [Bulk Upload System](#11-bulk-upload-system)
12. [Export System (CSV / PDF)](#12-export-system-csv--pdf)
13. [GraphQL API Layer](#13-graphql-api-layer)
14. [Data Models](#14-data-models)
15. [Role-Based Access Control (Guards)](#15-role-based-access-control-guards)
16. [Payment Methods](#16-payment-methods)
17. [Build, Deploy & CI/CD](#17-build-deploy--cicd)

---

## 1. Tech Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 16.x | UI framework |
| Material-UI (MUI) v4 | `@material-ui/core ^4.12.4` | Primary component library |
| Material-UI (MUI) v5 | `@mui/material ^5.x` | Select, Paper (mixed v4+v5) |
| Apollo Client | `@apollo/client ^3.x` | GraphQL data fetching |
| graphql-tag | `^2.12.x` | gql template literals |
| Redux Toolkit | `@reduxjs/toolkit ^1.x` | Global state management |
| react-redux | `^7.x` | Redux bindings |
| Formik | `^2.x` | Form management |
| Yup | `^0.32.x` | Form validation schemas |
| Notistack | `^1.x` | Snackbar notifications |
| React Router DOM | `^5.x` | Client-side routing (`useHistory`, `useParams`) |
| moment | `^2.x` | Date formatting |
| numeral | `^2.x` | Number/currency formatting |
| axios | `^0.x` | Direct REST calls |
| AWS SDK | `^2.x` | S3 document upload |
| react-dropzone | `^11.x` | Drag-and-drop file upload |
| xlsx | `^0.17.x` | Excel file parsing (bulk upload) |
| react-data-export | `^0.6.x` | Excel/CSV export |
| @react-pdf/renderer | `^2.x` | Client-side PDF generation |
| react-apexcharts / apexcharts | `^3.x` | Charts (bar, line, pie, radial) |
| react-perfect-scrollbar | `^1.x` | Smooth scrollbars |
| @mui/lab | DateRangePicker | Date range picker |
| notistack | `^1.x` | Toast notification queues |

### Backend
- GraphQL via Apollo Server (GQLFeeClient, GQLSettingsClient — two separate endpoints)
- REST via Axios (some direct endpoints for file ops)
- AWS S3 for document/file storage
- Two S3 buckets: `erp-user-docs` (test), `erp-user-docs-prod` (production)
- AWS Cognito for user authentication
- Institution config loaded from S3 bucket: `erpinstitution`

---

## 2. Project Structure

```
src/
├── App.js                    # Root with all context providers
├── Rules.json                # Theme/brand config JSON
├── StudentHeader.json        # Student table column config JSON
├── assets/css/prism.css
├── components/               # Shared UI components (81 files)
│   ├── AddDocument.js        # PDF upload to S3 via GraphQL
│   ├── AddInitDoc.js         # Multi-format upload (queued)
│   ├── AddInitDocw.js        # Variant of AddInitDoc
│   ├── Box/                  # RoundedBox wrapper
│   ├── Button/               # 12 button variants (old folder)
│   ├── Buttons/              # 13 button variants (new folder — USE THIS)
│   ├── Cards/                # MainCard, RoundCard, AnalyticEcommerce
│   ├── Charts/               # BasicChart, PieChart, StackedColumns, PaymentCard
│   ├── Checkbox.js           # MUI Checkbox wrapper
│   ├── Dialog/               # AddDocument, AddDocumentUpdate, CardSubmitModal, RoundDialog
│   ├── Drawer/               # RoundDrawer, SweapDrawer, SweapDrawerMobile
│   ├── ExportCSV.js          # CSV download helper
│   ├── FilesDropzone.js      # react-dropzone wrapper
│   ├── Guards/               # Auth route guards (8 guards)
│   ├── Header/               # 6 header variants
│   └── ...
└── views/                    # Page components (~60 top-level folders)
    ├── Dashboard/
    ├── FeeSetup/
    ├── Schedule/
    ├── CollectFee/
    ├── Transactions/
    ├── TransactionsNew/
    ├── Scollarship/
    ├── Accounts/
    ├── Reports/
    ├── AllStudents/
    ├── InstSetup/
    ├── UserManagement/
    ├── Remainders/
    ├── MessageLogs/
    ├── BillingTransactions/
    ├── AdmissionList/
    ├── AllAdmissions/
    ├── Approvals/
    ├── PromoteStudents/
    └── auth/LoginView/
```

---

## 3. Theme & Brand Identity

Source: `src/Rules.json`

```json
{
  "navbar_background_color": "#002250",
  "navbar_text_color": "#ffffff",
  "drawer_top_background_color": "#D9EAF6",
  "tabs_background_color": "#bbdefb",
  "login_page": {
    "rightImage": "url to background image",
    "textColor": "#ffffff",
    "detail_text_color": "#555555"
  }
}
```

### Color System
| Usage | Color |
|-------|-------|
| Primary / Navbar / Brand | `#002250` (dark navy blue) |
| Hover / Active primary | `#003780` |
| Success / Positive actions | `#2e7d32` (dark green) |
| Danger / Delete | `#c62828` (dark red) |
| Drawer top background | `#D9EAF6` (light blue) |
| Tabs background | `#bbdefb` (lighter blue) |
| White card border | `#eeeeee` |

### Typography — Custom MUI Overrides
- `BlueTextTypography` — color: `#1a237e`
- `RedTextTypography` — color: `#e53935`

---

## 4. Authentication

### Login Page (`src/views/auth/LoginView/JWTLogin.js`)
**UI:**
- Full-page split layout
- Left: Brand/logo image from S3 (bucket: `erpinstitution`)
- Right: Login form
- Background color: `Rules.login_page.rightImage`
- Email input field (outlined TextField)
- Password input field with show/hide toggle icon
- "Sign In" button (blue, full-width)
- "Forgot Password" link

**Flow:**
1. On mount: fetch institution config from S3 bucket `erpinstitution` using `window.location.origin`
2. Fetch tenant config (logo, institution name) from S3
3. On submit: call `useAuth().login(email, password)`
4. Auth uses AWS Cognito — JWT token stored in localStorage
5. Redirect to dashboard on success

**Additional Auth Pages:**
- `Forgot_Password.js` — Enter email → sends reset link
- `Confirm_email_sent.js` — Confirmation screen after forgot password
- `Confirm_forgot_password.js` — Enter confirmation code + new password
- `Change_Password.js` — Change password when logged in
- `Reset_Password.js` — Reset with token from email link
- `confirmSignUpafterLogin.js` — Verify email after first login

### Guards (`src/components/Guards/`)
| Guard | Description |
|-------|-------------|
| `AuthGuard` | Redirects to login if not authenticated |
| `GuestGuard` | Redirects to dashboard if already authenticated |
| `FeeGuard` | Requires fee module permission |
| `AdmissionGuard` | Requires admission module permission |
| `ExaminationGuard` | Requires exam module permission |
| `AlumniGuard` | Requires alumni module permission |
| `SetingsGuard` | Requires settings module permission |
| `SuperAdminGuard` | Super admin only |
| `UserGuard` | Regular user access |

---

## 5. Global Context Providers

From `src/App.js`, the entire app is wrapped in (outer to inner):

```jsx
<AuthProvider>          // JWT auth context — user, login(), logout()
  <FeeSetupProvider>    // Fee settings: programs, categories, heads, payment methods
    <DashboardProvider> // Dashboard stats: totals, paid, balance
      <ImportCompanySetupProvider> // Institution import/setup state
        <ReportProvider>           // Report filters & data
          <StreamProvider>         // Current stream (department) filter
            <YearProvider>         // Current academic year filter
              <ModalExecutionContextProvider> // Global modal queue
                <ErrorContextProvider>        // Global error handling
                  {renderRoutes(routes)}
                </ErrorContextProvider>
              </ModalExecutionContextProvider>
            </YearProvider>
          </StreamProvider>
        </ReportProvider>
      </ImportCompanySetupProvider>
    </DashboardProvider>
  </FeeSetupProvider>
</AuthProvider>
```

### Key Hooks
| Hook | Source | Returns |
|------|--------|---------|
| `useAuth()` | AuthProvider | `{ user, login, logout, isAuthenticated }` |
| `useFeeSetup()` | FeeSetupProvider | `{ programs, categories, feeHeads, paymentMethods, banks }` |
| `useStream()` | StreamProvider | `{ stream, setStream }` — current department/stream filter |
| `useYear()` | YearProvider | `{ year, setYear }` — current academic year filter |
| `useIsMountedRef()` | Local hook | Ref to check if component still mounted (prevents state update after unmount) |

---

## 6. Navigation & Routing

### Top Navbar
- Background: `#002250` (dark navy)
- Text: white
- Logo: loaded from S3
- Left: hamburger menu to toggle sidebar (stores `drawer: true/false` in localStorage)
- Right: user avatar, notification bell, year selector dropdown, stream selector dropdown

### Sidebar Drawer
- Width: 256px when open
- Top background: `#D9EAF6` (light blue)
- Menu groups and items based on user role

### Route Structure
```
/dashboard              → Dashboard
/fee/setup              → Fee Setup (Fee Types, Categories, Structures)
/fee/schedules          → Schedule List
/fee/schedules/:id      → Schedule Detail (Statistics, Orders, Payments, Fee Details)
/fee/collect            → Collect Fee (Student List)
/fee/transactions       → Transactions (Payments, Orders, Refunds)
/fee/transactions-new   → Transactions New
/fee/scholarship        → Scholarship List
/accounts/rtgs          → Accounts RTGS/NEFT
/reports                → Reports Module (20+ report types)
/students               → All Students
/institution/setup      → Institution Setup
/users                  → User Management
/reminders              → Fee Reminders
/messages               → Message Logs
/admissions             → Admission List / Approvals
/promote                → Promote Students
```

---

## 7. UI Component Library

### Button System (`src/components/Buttons/`)

#### `CustomButton.js`
The primary button component. Props: `color`, `size`, `title`, `onClick`, `loading`, `tooltip`, `options` (dropdown).

Color map:
```js
const colorMap = {
  blue:   { background: '#002250', text: '#fff', hover: '#003780' },
  green:  { background: '#2e7d32', text: '#fff', hover: '#1b5e20' },
  red:    { background: '#c62828', text: '#fff', hover: '#b71c1c' },
  white:  { background: '#fff',    text: '#002250', hover: '#f5f5f5' },
  grey:   { background: '#757575', text: '#fff', hover: '#616161' },
  yellow: { background: '#f57f17', text: '#fff', hover: '#e65100' },
}
```

Size map:
```js
const sizeMap = {
  small:  { padding: '4px 12px', fontSize: '0.75rem' },
  medium: { padding: '8px 20px', fontSize: '0.875rem' },
  large:  { padding: '12px 28px', fontSize: '1rem' },
}
```

Features: Loading spinner (CircularProgress), Tooltip wrapping, Dropdown menu via MUI Menu.

#### `CustomStatusButton.js`
Status-colored button for order/payment status display. Colors based on `status` prop: `paid`, `partial`, `created`, `cancelled`, `refunded`.

#### `IconButton.js`
Icon-only button with optional tooltip and border. Takes MUI SvgIcon or react-feather icon.

#### `RoundBlue.js`, `RoundGreen.js`, `RoundRed.js`, `RoundYellow.js`, `RoundGrey.js`
Pill-shaped colored buttons (border-radius: 20px).

#### `RoundOutlineBlue.js`, `RoundOutlineGreen.js`, `RoundOutlineRed.js`, `RoundOutlineGrey.js`, `RoundOutlineYellow.js`
Outlined pill-shaped buttons.

#### `ButtonGroup.js`
Group of buttons rendered in a flex row with spacing.

### Card System (`src/components/Cards/`)

#### `MainCard.js`
Standard white container card:
```js
style = {
  backgroundColor: 'white',
  border: '1px solid #eeeeee',
  borderRadius: 2,
  boxShadow: 'none',
  padding: 0
}
```
Props: `title` (optional header), `secondary` (action element), `children`.

#### `RoundCard.js`
White card with subtle shadow:
```js
style = {
  backgroundColor: 'white',
  boxShadow: '0px 4px 6px rgba(0,0,0,0.02)',
  borderWidth: 0,
  borderRadius: 8
}
```

#### `AnalyticEcommerce.js`
KPI stat card:
- Title (small uppercase gray text)
- Count (large bold number)
- Percentage chip: green chip with RiseOutlined icon (positive), red chip with FallOutlined icon (negative)
- Extra text (small sub-label)

### Header System (`src/components/Header/`)

#### `CustomHeader.js` / `CustomHeaderNew.js`
Page header with:
- Title text (left)
- Stream selector dropdown (right)
- Year selector dropdown (right)
- Action button (right)

#### `CustomSubHeader.js`
Sub-page header with:
- Back arrow button
- Title
- Subtitle/breadcrumb

#### `TabHeader.js`
Header with embedded MUI Tabs:
- Page title
- Tab list with value/label
- Optional action button
- Tabs background color: `#bbdefb`

#### `TextHeader.js`
Simple text-only header.

#### `TextHeaderWithBack.js`
Text header with back navigation arrow.

### Dialog System (`src/components/Dialog/`)

#### `RoundDialog.js` / `RoundDialog1.js`
MUI Dialog with border-radius: 12px, no sharp corners.

#### `AddDocument.js` (Dialog variant)
Dialog that wraps the document upload flow with:
- File picker (PDF only, max 1MB)
- S3 upload progress
- GraphQL mutation on success

#### `CardSubmitModal.js`
Large confirmation/submission modal with:
- Summary card content
- Submit/Cancel buttons
- Loading state

### Chart System (`src/components/Charts/`)

#### `BasicChart.js`
ApexCharts bar chart. Props: `categories` (x-axis), `data` (values), `title`.

#### `PaymentCard1.js` / `PaymentCard11.js`
Combined card + bar chart showing payment breakdown per program/category.

#### `PieChart.js`
ApexCharts donut/pie chart. Props: `labels`, `series`.

#### `StackedColumns.js` / `StackedColumns1.js`
ApexCharts stacked bar chart for multi-series data (e.g., paid vs due by program).

#### `StackedColumnsfeedback.js`
Stacked bar chart for feedback/ratings data.

---

## 8. Feature Modules

---

### 8.1 Dashboard

**Route:** `/dashboard`  
**File:** `src/views/Dashboard/index.js`

#### UI Layout
1. **Header** — `Header.js`: Page title + Academic Year dropdown filter + Stream (department) filter + Date range picker (DateRangePicker from MUI Lab)
2. **KPI Cards row** (4 cards using `AnalyticEcommerce`):
   - Total Fee Demand
   - Total Fee Collected (paid)
   - Total Fee Balance (due)
   - Number of Payments
   - Each card is clickable — clicking it filters the charts below to that metric
   - Active card gets highlighted with a blue border
3. **Programs section** (`Programs/index.js`): Per-program circular progress indicators showing collection %
4. **Financial Stats chart** (`FinancialStats/index.js`): Line/bar chart of monthly fee collection
5. **Earnings Segmentation** (`EarningsSegmentation/index.js`): Pie/donut chart — breakdown by fee category
6. **PerformanceOverTime** (`PerformanceOverTime/index.js`): Stacked column chart by month
7. **NewProjects** (`NewProjects.js`): Recent schedules/activities table
8. **RoiPerCustomer** (`RoiPerCustomer.js`): Per-student fee metrics
9. **SystemHealth** (`SystemHealth.js`): System status indicators
10. **LineChart** (`LineChart.js`): Trend line of daily collections
11. **RadialChart** (`RadialChart.js`): Radial bar chart for collection vs target

#### Filters
- Academic Year: dropdown (All / specific year options)
- Date Range: MUI DateRangePicker (default: last 30 days)
- Stream: from `useStream()` context

#### Data Source
- GraphQL via `GQLFeeClient` (Feeclient): `get_fee_dashboard_data` query
- Also uses `GQLSettingsClient` for institution info

---

### 8.2 Fee Setup

**Route:** `/fee/setup`  
**Files:** `src/views/FeeSetup/`

#### Tabs
The Fee Setup page has tabs navigating between sub-sections:

##### Tab 1: Fee Types (`FeeSetup/FeeType/`)
**List view** (`Streams.js`): Table of fee types/heads
- Columns: #, Fee Type Name, Stream, Nature, Actions (Edit | Delete)
- Add button → `AddFeeType.js` modal

**`AddFeeType.js` modal:**
- Name (text)
- Stream (dropdown from `useStream()`)
- Fee Nature (dropdown: `feeNature.js` — values: Tuition, Exam, Hostel, Library, etc.)
- Submit → GraphQL mutation

**`EditFeeType.js`** — same form pre-filled  
**`DeleteFeeType.js`** — confirmation dialog

##### Tab 2: Fee Categories (`FeeSetup/FeeCategory/`)
**`FeeCategories.js`**: Table of categories
- Columns: #, Category Name, Stream, Module, Actions
- Inline edit capability

**`Add.js`** form:
- Category Name
- Stream (from context)
- Module Name (Fee | Exam | Hostel | Library)
- Default Category toggle

**`Edit.js`** — pre-filled form  
**`Delete.js`** — confirmation

##### Tab 3: Fee Structures (`FeeSetup/FeeStructure/`)
Most complex sub-module.

**`FeeStructureList.js`**: Grouped table
- Columns: Program, Batch, Quota, Stream, Total Amount, Actions (View | Edit | Delete)
- Group by Program + Batch
- Search/filter bar

**`AddFeeStructure.js`** — multi-step form:
- Step 1: Select Program, Batch, Quota, Stream
  - MultiSelect components for each
- Step 2: Add fee heads/particulars
  - `FeeParticulars.js`: Dynamic list — add/remove rows
  - Each row: Fee Head dropdown, Amount (₹)
  - Auto-calculates total
- Step 3: Review & Submit
- GraphQL mutation to create fee structure

**`FeeStructureDetailView.js`**: View breakdown by fee head

**`EditFeeStructure.js`**: Edit existing structure

##### Tab 4: Accounts (`FeeSetup/Accounts/`)
- Fee account heads (linked to bank accounts)
- Add/Edit/Delete CRUD

#### Data APIs (GraphQL)
```graphql
# Get all fee structures
query { get_fee_structures(stream_id, app_type) { ... } }

# Create fee structure
mutation create_fee_structure($input: FeeStructureInput) { ... }

# Get fee types/heads
query { get_fee_type(stream_id, app_type) { ... } }

# Get fee categories
query { get_fee_category(stream_id, app_type, module_name) { ... } }
```

---

### 8.3 Schedule (Fee Schedules)

**Route:** `/fee/schedules` (list) → `/fee/schedules/:id` (detail)  
**Files:** `src/views/Schedule/`

#### Schedule List (`schedule.js`)
**UI:**
- Page title "FEE SCHEDULE" + Stream selector + Year selector
- Two tabs: **SCHEDULES** | **HISTORY**
- SCHEDULES tab: Active/published schedules
- HISTORY tab: Archived/closed schedules

**Schedule card/row:**
- Schedule Name
- Program(s) covered
- Academic Year
- Batch
- Term
- Status chip: Draft / Published / Closed
- Action buttons: View | Edit | Delete | Publish

#### Draft Schedule Detail (`DraftScheduleFee/`)
**Route:** `/fee/schedules/:id`

##### Dashboard sub-view (`Dashboard.js`)
This is the main detail page wrapper with 5 tabs:

**Tab 1: Statistics** (`Statistics.js`)
- 8 KPI cards:
  - Total Orders
  - Total Amount Demanded
  - Total Collected
  - Total Balance
  - Paid (full)
  - Partial
  - Pending
  - Cancelled
- Program-wise table:
  - Columns: Program, Batch, Quota, Total Students, Total Amount, Collected, Balance, % Collected
  - Totals row at bottom
- Export PDF button → `StatisticsExportPDF.js` (react-pdf/renderer)
- Charts: StackedColumns showing collected vs balance per program

**Tab 2: Orders** (`Orders.js`)
- Table of all fee orders in the schedule
- Columns: #, USN, Student Name, Program, Batch, Amount (₹), Paid (₹), Due (₹), Status, Actions
- Status chips: created / partial / paid / cancelled (color-coded)
- Search box
- Filters: Program dropdown, Status dropdown
- Per-row actions: View order details, Update order, Print invoice
- Bulk actions: Select all, Export CSV
- Pagination
- Export CSV → `OrdersExportCSV.js`

**Tab 3: Payments** (`Payments.js`)
- Table of actual payment transactions linked to orders in this schedule
- Columns: #, Student Name, USN, Payment ID/Ref, Amount (₹), Method, Mode, Date, Status, Invoice
- Method pills: CASH / DD / CHEQUE / RTGS-NEFT / POS / ONLINE
- Mode pills: offline / online
- Search box
- Date range filter
- Method filter dropdown
- Print/download invoice per row
- Total collected display at top

**Tab 4: Fee Details** (`FeeDetails.js`)
- Accordion list of fee structures in this schedule
- Each item shows: Program name, Batch, Quota, Total Amount
- Expand to see fee head breakdown table:
  - Columns: #, Fee Head Name, Amount (₹)
  - Total row
- Export PDF → `FeeDetailsExportPDF.js`

**Tab 5: Bulk Upload (Orders)** (via `BulkUploadOrders/`)
- Step 1: Download template CSV
  - Template columns: USN, Name, Program, Batch, Amount, Fee Category
- Step 2: Fill and upload CSV
  - `UploadCSV.js`: react-dropzone file picker
  - Parses XLSX/CSV using `xlsx` library
- Step 3: Preview table of parsed rows
- Step 4: Submit → API call creates fee orders in bulk
- Success/error summary

**Bulk Upload Transactions** (`BulkUploadTransactions/`)
Same flow but for payment transactions:
- Template columns: USN, Order ID, Amount, Date, Method, Reference, Description

#### Create/Edit Schedule
- Modal or separate form
- Fields: Schedule Name, Academic Year, Term, Programs (multiselect), Batches (multiselect), Quotas, Fee Structure selection
- Status: Draft on creation, publish via action button

---

### 8.4 Collect Fee

**Route:** `/fee/collect`  
**Files:** `src/views/CollectFee/`

#### Page Layout
Page title "COLLECT FEE" at top.

**Students table** (`students.js`):
- Loads all students from backend
- Columns:
  - Checkbox (select row)
  - Student Name (avatar + name + email sub-line)
  - USN
  - Program
  - Batch
  - Year/Term
  - Status (chip: Active/Inactive)
  - Wallet Balance (₹)
  - Fee Due (₹)
  - Actions: **Collect Fee** button per row

**Collect Fee button opens** `CollectFee/CollectFeeModal.js`:

#### CollectFeeModal (`AllStudents/CollectFee/CollectFeeModal.js`)
Full-featured payment collection dialog.

**UI:**
- Dialog header: Student name + USN
- Left column (or single column on mobile):
  - Fee Order selector (dropdown — shows open orders for student)
  - Order details: Amount demanded, Paid so far, Balance due
  - Fee Heads breakdown table (read-only)
  - **Minimum Amount** toggle (can pay less than full amount)
  - Amount to Collect field (₹, pre-filled with due amount)
  - Description / Notes field (optional)
  - **Payment Method** selector:
    - Fetched from `get_fee_setting.payment_methods` filtered by `user_collect_enabled == true && enabled == true`
    - Options: CASH, DD, CHEQUE, POS, RTGS/NEFT, Book Adjustment
  - **Method-specific fields** (conditional):
    - DD: DD Number, DD Date, Bank Name, Branch
    - CHEQUE: Cheque Number, Date, Bank
    - RTGS/NEFT: Transaction Reference Number, Date, Bank
    - POS: POS opens `CollectPosModal.js` for POS terminal flow
  - Bank selector (from `get_fee_setting.payment_banks`)
  - Submit button (CustomButton, blue, loading state)

**On Success:**
- Opens `CollectFeeSuccessModal.js`:
  - Shows payment summary
  - Option to print invoice (select invoice template)
  - "Collect Another" button
  - "Done" button

**CollectPosModal (`CollectPosModal.js`):**
- POS terminal flow
- Shows QR/reference for POS payment
- Polling for payment confirmation

**CollectFeeRevaluationModal.js:**
- For exam fee/revaluation fee collection
- Similar form but scoped to exam module

#### GraphQL Mutations (Collect Fee)
```graphql
mutation collect_fee($input: CollectFeeInput!) {
  collect_fee(input: $input) {
    _id
    order_id
    payment_id
    pay_amount
    pay_status
    method
    mode
    offline_ref
    captured_date
    fee_category
    student_id
    usn
  }
}

query get_fee_setting($stream_id: String!, $app_type: String!) {
  get_fee_setting(stream_id: $stream_id, app_type: $app_type) {
    payment_methods {
      _id
      name
      mode
      enabled
      user_collect_enabled
      bank_detail_visible
    }
    payment_banks { _id, bank_name, account_no, ifsc }
  }
}
```

---

### 8.5 Transactions

**Route:** `/fee/transactions` (old module)  
**Files:** `src/views/Transactions/`

#### Three Tabs

##### Tab: PAYMENTS (`Payments.js`)
**UI:**
- 50KB+ component — most complex view
- Filters bar: Search, Date range, Program, Batch, Status, Method, Mode, Fee Category
- Table columns: #, Student Name, USN, Program, Order ID, Amount, Method, Mode, Reference, Date, Status, Invoice, Actions
- Row actions: View detail, Print invoice, Process refund
- Status chips colored by: captured / pending / refunded / failed / cancelled
- Pagination
- Bulk select → Export CSV
- **"Update Payment" button** per row (opens `PaymentUpdatedDetail.js` 60KB — comprehensive detail)

**Payment Detail Drawer/Page** (`PaymentDetail.js` — 50KB):
- Full payment details
- Student info section
- Order info section
- Transaction info section
- Fee head breakdown
- Invoice download dropdown (multiple templates: Invoice, Invoice4, Invoice4B, Invoice4BC, Invoice4C, Invoice7, Invoice7C, InvoiceC)
- Issue Refund button

##### Tab: ORDERS (`Orders.js`)
- All fee orders across all schedules
- Columns: Order ID, USN, Student Name, Amount, Paid, Due, Status, Schedule, Actions
- Filters: Status, Program, Batch, Schedule
- Row action: View → `OrderDetail.js` (51KB detail page)
- `OrderDetailExam.js` — exam-specific order detail
- `OrderDetailExamCollectFee.js` — collect fee from within order detail

##### Tab: REFUND (`Refund.js`)
- Table of all refund records
- Columns: Student Name, USN, Refund Amount, Reason, Date, Status
- Actions: View → `RefundDetail.js`, Print refund invoice → `RefundInvoice/`
- `RefundDetailDrawer.js` — slide-out drawer with full refund info
- `IssueRefund.js` — form to initiate a refund
- `ProcessRefund.js` — process/approve a pending refund

---

### 8.6 Transactions New

**Route:** `/fee/transactions-new`  
**Files:** `src/views/TransactionsNew/`

Updated version of Transactions with improved UX.

#### Three Tabs: Payments | Orders | Refunds

##### Payments (`Payments.js` — 49KB)
Enhanced payments list:
- Fetches fee categories from GraphQL first (for filter options)
- Same columns as old Transactions but with better filtering
- Date range filter with presets

##### Orders (`Orders.js` — 43KB)
- Create Order button → `CreateOrder.js` (35KB)
  - Form: Student search (autocomplete), Fee Structure selection, Amount, Program/Batch, Term
  - Generates fee order in GraphQL

##### Refunds (`Refund.js` — 34KB)
- Improved refund list with better status tracking

---

### 8.7 Scholarship

**Route:** `/fee/scholarship`  
**Files:** `src/views/Scollarship/`

#### Scholarship List (`Students.js`)
- Table of students with scholarship records
- Columns: USN, Student Name, Program, Scholarship Type, Amount, Status
- Search, Filter by program/type
- Row actions: View, Edit, Delete

#### Student Scholarship Detail (`StudentScholarshipView/`)
**Route:** `/fee/scholarship/:id`

**Tabs:**
1. **Dashboard** (`StudentDashboardDetail.js`): Overview of scholarship amounts, orders affected
2. **Orders** (`StudentOrders.js`): Fee orders linked to this scholarship
3. **Amount** (`Amount.js`): Detailed amount breakdown

**Actions:**
- `AddCourse.js` — Assign scholarship to a course/order
- `EditDetails.js` — Edit scholarship basic info
- `EditDetailsAmount.js` — Edit scholarship amounts per head
- `Delete.js` — Remove scholarship

**Scholarship Types** (from `AddScollarship/` view):
- Government Scholarship
- Management Scholarship
- SNQ Scholarship
- Full Scholarship
- Partial Scholarship
- Custom amount

---

### 8.8 Accounts / RTGS-NEFT

**Route:** `/accounts/rtgs`  
**Files:** `src/views/Accounts/RTGS_NEFT/`

For recording bank transfer payments (RTGS/NEFT) received from students.

#### List View
- Table of RTGS/NEFT payment records
- Columns: Reference No, Student Name, USN, Amount, Bank, Date, Status, Actions
- Add RTGS/NEFT Payment button → `AddOnlinePayment.js`

#### Add RTGS/NEFT Payment (`AddOnlinePayment.js`)
Form fields:
- Student search (autocomplete by USN/name)
- Amount (₹)
- Transaction Reference Number
- Date of transfer
- Bank name
- Order ID (optional — links to fee order)
- Fee Category

Actions:
- `EditOnlinePayment.js` — edit existing record
- `DeleteRTGS.js` — delete/cancel
- `DownloadAck.js` — download acknowledgment letter
- `ExportPDF.js` — print summary PDF

#### Bulk Upload Payments (`BulkUploadStudents/`)
- Download template CSV
- Upload CSV with columns: USN, Amount, Date, Reference, Bank
- Preview → Submit

#### Invoice (`Invoice/`)
- Generate invoice for RTGS/NEFT payment
- Uses same invoice template system

#### `CollectFeeModal.js` (Accounts variant)
- Offline fee collection from RTGS context
- Links payment to existing fee order

#### `CollectFeeMiscellaneousModal.js`
- Miscellaneous/general fee collection (not linked to specific order)
- Fields: Student, Amount, Description, Category, Method, Reference, Date

---

### 8.9 Reports

**Route:** `/reports`  
**Files:** `src/views/Reports/`

Report list is loaded dynamically from GraphQL (`get_reports_by_module`) — each report is registered in the backend by name and section.

#### Available Reports (20+)

| Report Name | Description |
|------------|-------------|
| **Day Book Report** | Daily payment collection ledger |
| **Day Book Report New** | Enhanced day book with more columns |
| **Custom Day Book Report** | Day book with custom date range |
| **General Day Book Report** | Day book for general/miscellaneous fees |
| **General Day Book Report Custom** | General day book with custom date |
| **Monthly Abstract Report** | Month-wise collection summary |
| **General Monthly Abstract Report** | Monthly abstract for general fees |
| **General Monthly Abstract Report Custom** | Custom date range version |
| **Yearly Abstract Report** | Year-wise collection summary |
| **General Yearly Abstract Report** | Yearly abstract for general fees |
| **General Yearly Abstract Report Custom** | Custom version |
| **Balance Report** | Student-wise balance (amount due) |
| **Consolidated Balance Report** | Program-wise consolidated balance |
| **Department Consolidated Balance Report** | Department-wise balance |
| **Student Consolidated Balance Report** | Individual student full balance history |
| **Demand Report** | Fee demanded vs collected |
| **Demand Collection Report** | Demand vs collection with balance |
| **Consolidated Demand Collection Report** | Program-level demand collection |
| **Head-wise Demand Collection Report** | Per fee-head breakdown |
| **Online Payment Report** | Online payment transactions only |
| **Online Settlement Report** | Bank settlement reconciliation |
| **Cancellation Report** | Cancelled orders/payments |
| **Refund Report** | All refund records |
| **Excess Fee Report** | Overpaid amounts |
| **Certificate Register** | Certificates issued log |
| **Pay Record DCR** | Payment record day cash register |
| **Billing Pay Record DCR** | Billing module DCR |
| **Daily Bank Report** | Bank-wise daily collections |
| **General Daily Bank Report** | General fees bank report |
| **General Daily Bank Report Custom** | Custom version |
| **Circulation Day Book Report** | Library circulation fees |
| **Library General Day Book Report** | Library day book |

#### Each Report Page Structure
Every report follows the same pattern:
1. **Header** (`Header.js`): Report title + filter controls
2. **Filter controls** (varies by report):
   - Date / Date Range pickers
   - Program multiselect
   - Quota multiselect  
   - Fee Category multiselect
   - Fee Heads multiselect
3. **Report table** (`Report.js`): Data table with report columns
4. **Actions:**
   - **Export CSV** → `ExportCSV.js` (react-data-export / xlsx)
   - **Export PDF** → `ExportPDF.js` (@react-pdf/renderer)
   - **Confirm Download** → `ConfirmDownload.js` (dialog asking format)
5. **No Data** placeholder when empty (`NoData.js`)

---

### 8.10 Student Fee (Student View)

**Route:** `/student-fee`  
**Files:** `src/views/StudentFee/`

Student-facing fee portal (when students log in).

- View own fee orders
- View payment history
- Pay online (redirect to payment gateway)
- Download receipts/invoices

---

### 8.11 All Students

**Route:** `/students`  
**Files:** `src/views/AllStudents/`

#### Student List
- Columns: USN, Name, Program, Batch, Term, Status, Wallet, Due, Actions
- Filters: Program, Batch, Year, Status, Search
- Row actions:
  - View student profile
  - **Collect Fee** → opens `CollectFee/CollectFeeModal.js`
  - View exam info → `CollectFee/CollectFeeRevaluationModal.js`

#### Exam Invoice (`ExamInvoice/`)
- Printable exam fee invoice template
- Separate from main fee invoice templates

---

### 8.12 Institution Setup

**Route:** `/institution/setup`  
**Files:** `src/views/InstSetup/`

#### Sub-sections (tab/menu based):

##### Stream Management (`Stream/`)
- List of streams/departments
- Add Stream: Name, Code, Programs assigned, Quota assigned
- `AddStreamNew/` — enhanced add flow with Programs + Quotas inline
- Detail view: Programs list, Quota list, Faculty count
- Edit/Delete stream

##### Program Management (`InstSetup/Programs/`)
- List of academic programs (B.E., M.Tech, MBA, etc.)
- Add/Edit/Delete programs
- Link to streams

##### Batch Management (`Batch/`)
- List of academic batches (e.g., 2021-25)
- Add Batch: Year start, Year end, Program, Stream
- Batch Detail: List of terms/semesters
  - Add/Edit/Delete terms per batch
  - `BatchDetailView/`: Term table with dates

##### Academic Year (`AcademicYear/`)
- List of academic years (e.g., 2023-24)
- Add/Edit/Delete academic years

##### Quota Management (`Quota/`)
- List of admission quotas (Government, Management, NRI, etc.)
- Add/Edit/Delete

##### Institution Details (`Details/`)
- Institution name, address, logo
- `TenantInfo.js`: Tenant/subscription info
- Edit contact, address details

##### Email Templates (`EmailTemplate/`)
- Configure email templates for fee reminders, receipts
- Template variables: {student_name}, {amount}, {due_date}

##### Integrations (`Integrations/Integration.js`)
- Payment gateway config (Razorpay, etc.)
- SMS/WhatsApp gateway config

##### Users (`Users/`)
- Admin user management within institution

---

### 8.13 User Management

**Route:** `/users`  
**Files:** `src/views/UserManagement/`

#### Admin Users (`Admins.js`)
- List of admin/staff users
- Columns: Name, Email, Role, Last Active, Status, Actions
- Role chips: Super Admin, Admin, Finance, Cashier, Viewer

#### All Users (`Users.js` — 65KB)
- Complete user directory
- Advanced filters: role, status, program, batch
- Bulk actions: Activate, Deactivate, Export

#### Add User (`AddUser.js`)
Form:
- Email, Name, Mobile
- Role assignment (multiselect)
- Program access (which programs they can view)
- Stream access

#### Edit User Role (`EditUserRole.js`)
- Change user role and permissions

#### Assign Admin (`AssignAdmin.js`)
- Assign admin rights to existing user

#### Notes (`Notes/index.js`)
- Internal notes about users/students

#### Notification Settings (`NotificationSettings/index.js`)
- Per-user notification preferences

#### Ratings (`Ratings/index.js`)
- User/staff performance ratings

#### Benefits (`Benifit/`)
- Staff benefits/payslip view
- `ViewPayslip.js` — payslip viewer
- `ExportPDF.js` — payslip PDF export
- `AllStudentInfo.js` — all students info view

---

### 8.14 Reminders

**Route:** `/reminders`  
**Files:** `src/views/Remainders/`

Fee payment reminder system.

**UI:**
- Header with title and filters
- Schedule selector (which fee schedule to send reminders for)
- Section selector (which student groups)
- Semester filter
- Fee structure category filter
- Reminder preview (shows who will receive, what message)
- Send button → triggers email/SMS/WhatsApp reminders

**Flow:**
1. Select fee schedule
2. Select sections/programs to remind
3. Preview message template
4. Send → GraphQL mutation triggers notification jobs

---

### 8.15 Message Logs

**Route:** `/messages`  
**Files:** `src/views/MessageLogs/`

**`Notification.js`**: Table of all sent notifications/messages
- Columns: Type (Email/SMS/WhatsApp), Recipient, Message preview, Status, Date, Actions
- Filter by type, date range, status
- View full message content

---

### 8.16 Billing Transactions

**Route:** `/billing`  
**Files:** `src/views/BillingTransactions/`

General billing module (non-fee items: library fines, hostel charges, etc.).

- Customer management
- Order creation (non-fee)
- Payment recording
- Reports: `BillingPayRecordDCR/`

---

### 8.17 Admission List & Approvals

**Route:** `/admissions`  
**Files:** `src/views/AdmissionList/`, `src/views/Approvals/`, `src/views/AllAdmissions/`

- Admission application list
- Status tracking (Applied → Verified → Approved → Enrolled)
- Kanban board view (`Admissions/Schedules/Kanban/`) for visual pipeline
- Analytics charts (`Admissions/Schedules/Analytics.js`)
- Move student between stages (`MoveStudent.js`)

---

### 8.18 Promote Students

**Route:** `/promote`  
**Files:** `src/views/PromoteStudents/`, `src/views/PromoteStudentsVerify/`

- Select students to promote to next semester/year
- Verification step
- Bulk promotion action

---

## 9. Invoice System

Multiple invoice templates available. User selects template when printing receipt.

**Template List:**
| Template | Folder | Use Case |
|----------|--------|---------|
| Invoice (standard) | `Transactions/Invoice/` | Default receipt |
| Invoice4 | `Transactions/Invoice4/` | 4-copy format |
| Invoice4B | `Transactions/Invoice4B/` | 4-copy bank copy |
| Invoice4BC | `Transactions/Invoice4BC/` | 4-copy bank consolidated |
| Invoice4C | `Transactions/Invoice4C/` | 4-copy cashier |
| Invoice7 | `Transactions/Invoice7/` | 7-section format |
| Invoice7C | `Transactions/Invoice7C/` | 7-section cashier |
| InvoiceC | `Transactions/InvoiceC/` | Cashier copy |
| RefundInvoice | `Transactions/RefundInvoice/` | Refund receipt |
| ExamInvoice | `AllStudents/ExamInvoice/` | Exam fee receipt |
| RTGS Invoice | `Accounts/RTGS_NEFT/Invoice/` | RTGS/NEFT acknowledgment |

### Invoice Component Structure
Each template folder contains:
- `Invoice.js` — Main PDF renderer (@react-pdf/renderer), assembles all parts
- `InvoiceDetail.js` — Student info + payment details (12-13KB, largest component)
- `InvoiceNo.js` — Receipt number display (7KB)
- `InvoiceItemsTable.js` — Fee head breakdown table
- `InvoiceTableHeader.js` — Table header row
- `InvoiceTableRow.js` — Data row
- `InvoiceTableFooter.js` — Total/footer row
- `InvoiceTableBlankSpace.js` — Padding/blank rows
- `InvoiceTablePaid.js` — Paid amount row
- `InvoiceTableTotalWords.js` — Amount in words (e.g., "Five Thousand Rupees Only")
- `CashierDetail.js` — Cashier/collector signature section
- `InvoiceTitle.js` — Institution header with logo
- `InvoiceThankYouMsg.js` — "Thank you" footer message
- `Watermark.js` — Diagonal watermark (e.g., "DUPLICATE")
- `PaymentDetail.js` — Full payment info (7-8KB)
- `data/invoice.js` — Sample/demo data structure

### Invoice Data Flow
```js
// invoice.js data structure
{
  id: "INV-2024-001",
  invoice_no: "REC/2024/001",
  trans_date: "2024-01-15",
  due_date: "2024-01-31",
  company: {
    name: "Institution Name",
    address: "Address Line 1",
    phone: "+91-XXXXXXXXXX",
    logo: "s3-url-to-logo"
  },
  student: {
    usn: "1XX21CS001",
    name: "Student Full Name",
    program: "B.E. CSE",
    batch: "2021-25",
    term: "Sem 5"
  },
  items: [
    { fee_head: "Tuition Fee", amount: 45000 },
    { fee_head: "Library Fee", amount: 2000 },
  ],
  total: 47000,
  paid: 47000,
  balance: 0,
  payment: {
    method: "CASH",
    ref_no: "",
    date: "2024-01-15",
    cashier: "Cashier Name"
  }
}
```

---

## 10. Document Upload System

### AddDocument.js (`src/components/AddDocument.js`)
**Accepts:** PDF only  
**Max size:** 1MB  
**Storage:** AWS S3

**UI:**
- Document type dropdown (select what document this is)
- File input button (styled as "Choose File")
- File name display once selected
- Upload progress indicator
- Success/error state

**Flow:**
```
1. User selects PDF file
2. Validate: type=PDF, size≤1MB
3. Generate S3 key: {bucket}/docs/{student_id}/{docType}_{timestamp}.pdf
4. Upload to S3:
   - Bucket: "erp-user-docs" (test) or "erp-user-docs-prod" (prod)
   - Using AWS.S3 SDK directly from browser
5. On S3 success → call GraphQL mutation:
   mutation add_course_doc($input: DocumentInput!) {
     add_course_doc(input: $input) {
       _id
       doc_type
       doc_url
       uploaded_at
     }
   }
6. Show success notification via notistack
```

### AddInitDoc.js (`src/components/AddInitDoc.js`)
**Accepts:** PDF, JPG, PNG  
**Max size:** 1MB  
**Feature:** Client-side queue (multiple documents staged before upload)

**UI:**
- Dropzone area (react-dropzone)
- Document type selector per file
- File preview queue (list of staged files)
- "Upload All" button
- Per-file remove button

**Flow:**
1. User drops/selects files into dropzone
2. Each file queued in state array: `[{ file, docType, status: 'pending' }]`
3. `setDocument(files)` callback queues to parent
4. On "Upload All":
   - Generate S3 path: `{timestamp}_{random}_{filename}`
   - Upload each file to S3 sequentially
   - Call GraphQL mutation per file

---

## 11. Bulk Upload System

### Bulk Upload Orders (`Schedule/BulkUploadOrders/`)
**Purpose:** Create multiple fee orders at once via Excel/CSV

**Steps:**
1. `Header.js` — Page header with "Download Template" button
2. `ExportCSV.js` — Generates blank template XLSX with columns:
   - USN, Student Name, Program, Batch, Quota, Term, Amount
3. `UploadCSV.js` — Dropzone for file upload
   - Accepts `.xlsx`, `.csv`
   - Parses using `xlsx.utils.sheet_to_json()`
   - Shows parsed row count
4. `ProjectDescription.js` — Column mapping guide
5. `FinalExcelSubmit.js` — Preview table of parsed rows + Submit button
   - Shows success/error count
   - Error rows highlighted red

### Bulk Upload Transactions (`Schedule/BulkUploadTransactions/`)
Same flow for payment transactions:
- Template columns: USN, Order ID, Amount, Date, Method, Reference No, Description

### Bulk Upload RTGS/NEFT (`Accounts/RTGS_NEFT/BulkUploadStudents/`)
For bank transfer payments:
- Template: USN, Transaction Reference, Amount, Date, Bank Name

---

## 12. Export System (CSV / PDF)

### ExportCSV.js (`src/components/ExportCSV.js`)
Wrapper around `react-data-export`:
```js
<ExcelFile filename="export" element={<Button>Export</Button>}>
  <ExcelSheet data={rows} name="Sheet1">
    {columns.map(col => <ExcelColumn label={col.label} value={col.key} />)}
  </ExcelSheet>
</ExcelFile>
```

### PDF Export (react-pdf/renderer)
Used in Statistics, FeeDetails, Reports:
- `<PDFDownloadLink>` component triggers download
- `<PDFViewer>` for inline preview
- `@react-pdf/renderer` Document, Page, View, Text, Image, StyleSheet

### CSV via xlsx
Reports use `xlsx.utils.book_new()` + `xlsx.writeFile()` for CSV/Excel download.

---

## 13. GraphQL API Layer

Two separate Apollo clients:

### GQLFeeClient (`src/utils/GQLFeeClient.js`)
- Endpoint: fee/payment service
- Used by: Transactions, Schedule, CollectFee, Reports, Dashboard

### GQLSettingsClient (`src/utils/GQLSettingsClient.js`)  
- Endpoint: settings/institution service
- Used by: InstSetup, UserManagement, Auth, Dashboard

### Key Query Examples

```graphql
# Fee Orders for a Schedule
query get_orders_by_schedule($schedule_id: String!, $stream_id: String!) {
  get_fee_orders(schedule_id: $schedule_id, stream_id: $stream_id) {
    _id
    order_id
    usn
    student_name
    program
    batch
    quota
    fee_order_amount
    fee_paid_amount
    fee_due_amount
    order_status
    fee_category
    schedule_id
    created_at
  }
}

# Fee Transactions
query get_transactions($order_ids: [String!], $start: String, $end: String) {
  get_fee_transactions(order_ids: $order_ids, start: $start, end: $end) {
    _id
    payment_id
    pay_amount
    pay_status
    method
    mode
    offline_ref
    captured_date
    usn
    student_name
    order_id
    fee_category
    description
  }
}

# Fee Structure
query get_fee_structures($stream_id: String!) {
  get_fee_structures(stream_id: $stream_id) {
    _id
    program
    batch
    quota
    stream
    fee_total_amount
    fee_structure { fee_head, fee_head_amount }
  }
}

# Dashboard Stats
query get_fee_dashboard($stream_id: String!, $year: String!, $start: String, $end: String) {
  get_fee_dashboard(stream_id: $stream_id, year: $year, start: $start, end: $end) {
    total_demand
    total_collected
    total_balance
    no_of_payments
    program_breakdown {
      program
      demand
      collected
      balance
      student_count
    }
    monthly_data { month, collected, demand }
    category_breakdown { category, amount }
  }
}

# Settings
query get_fee_setting($stream_id: String!, $app_type: String!) {
  get_fee_setting(stream_id: $stream_id, app_type: $app_type) {
    payment_methods {
      _id, name, mode, enabled, user_collect_enabled, bank_detail_visible
    }
    payment_banks { _id, bank_name, account_no, ifsc, branch }
  }
}
```

---

## 14. Data Models

### FeeOrder
```js
{
  _id: ObjectId,
  order_id: String,           // Custom order ID (e.g., "ORD/2024/001")
  usn: String,                // Student USN
  student_name: String,
  student_id: ObjectId,       // Ref to Student
  program: String,
  batch: String,
  quota: String,
  stream: String,
  fee_schedule_id: ObjectId,  // Ref to FeeSchedule
  fee_category: String,
  fee_order_amount: Number,   // Total demanded
  fee_paid_amount: Number,    // Total paid
  fee_due_amount: Number,     // Balance due
  order_status: String,       // 'created' | 'partial' | 'paid' | 'cancelled'
  fee_structure_id: ObjectId,
  attempts: Number,           // Payment attempts count
  created_at: Date,
  updated_at: Date
}
```

### FeeTransaction
```js
{
  _id: ObjectId,
  payment_id: String,         // Payment gateway ID or manual ref
  order_id: ObjectId,         // Ref to FeeOrder
  order_custom_id: String,    // Human-readable order ID
  student_id: ObjectId,
  student_name: String,
  usn: String,
  fee_category: String,
  pay_amount: Number,
  pay_status: String,         // 'captured' | 'pending' | 'refunded' | 'failed'
  method: String,             // 'CASH' | 'DD' | 'CHEQUE' | 'RTGS / NEFT' | 'POS' | 'BOOK ADJUSTMENT'
  mode: String,               // 'offline' | 'online'
  offline_ref: String,        // DD/Cheque number, RTGS ref
  captured_date: Date,
  description: String,
  entity: String,             // 'fee_transaction'
  module_name: String,        // 'Fee' | 'Exam' | 'Hostel'
  created_at: Date
}
```

### FeeStructure
```js
{
  _id: ObjectId,
  program: String,
  batch: String,
  quota: String,
  stream: String,
  fee_total_amount: Number,
  fee_structure: [
    { fee_head: String, fee_head_amount: Number }
  ],
  academic_year: String,
  created_at: Date
}
```

### FeeSchedule
```js
{
  _id: ObjectId,
  schedule_name: String,
  academic_year: String,
  term: String,
  stream: String,
  programs: [String],
  batches: [String],
  quotas: [String],
  fee_structure_ids: [ObjectId],
  status: String,             // 'draft' | 'published' | 'closed'
  created_by: String,
  created_at: Date,
  published_at: Date,
  closed_at: Date
}
```

### FeeCategory
```js
{
  _id: ObjectId,
  category_name: String,
  stream_id: String,
  module_name: String,        // 'Fee' | 'Exam' | 'Hostel' | 'Library'
  app_type: String,
  default_category: Boolean
}
```

### FeeHead (Fee Type)
```js
{
  _id: ObjectId,
  fee_type_name: String,
  stream_id: String,
  fee_nature: String,         // 'Tuition' | 'Exam' | 'Hostel' | etc.
  app_type: String
}
```

### FeeRefund
```js
{
  _id: ObjectId,
  transaction_id: ObjectId,   // Original transaction
  order_id: ObjectId,
  student_id: ObjectId,
  usn: String,
  student_name: String,
  refund_amount: Number,
  reason: String,
  status: String,             // 'pending' | 'processed' | 'rejected'
  processed_by: String,
  created_at: Date,
  processed_at: Date
}
```

### Scholarship
```js
{
  _id: ObjectId,
  student_id: ObjectId,
  usn: String,
  student_name: String,
  scholarship_type: String,
  total_scholarship_amount: Number,
  applied_orders: [ObjectId],
  head_breakdown: [
    { fee_head: String, scholarship_amount: Number }
  ],
  status: String,
  academic_year: String,
  created_at: Date
}
```

---

## 15. Role-Based Access Control (Guards)

### Implementation Pattern
```jsx
// Route definition wraps component in guard
{
  path: '/fee',
  guard: FeeGuard,
  component: FeeLayout,
  routes: [...]
}
```

### FeeGuard Logic
```js
// Checks if user has 'fee' module in their permissions
if (!user.modules.includes('fee')) {
  return <Redirect to="/access-denied" />;
}
return children;
```

### Role Hierarchy
1. **Super Admin** — full access to everything
2. **Admin** — access to all modules in their institution
3. **Finance** — fee, reports, accounts modules
4. **Cashier** — collect fee, transactions (limited)
5. **Viewer** — read-only access

---

## 16. Payment Methods

Valid methods in the system:
```js
const PAYMENT_METHODS = [
  { value: 'DD',            label: 'DD (Demand Draft)',     mode: 'offline' },
  { value: 'PO',            label: 'PO (Pay Order)',        mode: 'offline' },
  { value: 'CHEQUE',        label: 'Cheque',               mode: 'offline' },
  { value: 'CASH',          label: 'Cash',                 mode: 'offline' },
  { value: 'RTGS / NEFT',   label: 'RTGS / NEFT',         mode: 'offline' },
  { value: 'BOOK ADJUSTMENT', label: 'Book Adjustment',   mode: 'offline' },
  { value: 'ONLINE',        label: 'Online',               mode: 'online'  },
  { value: 'POS',           label: 'POS / Card',           mode: 'offline' },
];
```

**Method-specific additional fields:**
- **DD**: DD Number, DD Date, Bank Name, Branch
- **CHEQUE**: Cheque Number, Date, Bank Name, Branch  
- **RTGS/NEFT**: Transaction Reference, Date, Bank Name, Sender Account
- **POS**: POS reference, Terminal ID
- **CASH**: No additional fields
- **BOOK ADJUSTMENT**: Description (required)

---

## 17. Build, Deploy & CI/CD

### Development
```bash
yarn install
yarn start   # React CRA dev server on port 3000
```

### Production Build
```bash
yarn build
# Output: build/ folder
```

### Docker (`Dockerfile`)
```dockerfile
FROM node:14-alpine as build
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx Config (`nginx/default.conf`)
- Serves React SPA
- `try_files $uri /index.html` for client-side routing

### CI/CD (`.github/workflows/aws.yml`)
- Trigger: push to main branch
- Build Docker image
- Push to AWS ECR
- Deploy to ECS Fargate

### Environment Variables (`.env`)
```
REACT_APP_GRAPHQL_FEE_URL=https://api.example.com/graphql
REACT_APP_GRAPHQL_SETTINGS_URL=https://settings.example.com/graphql
REACT_APP_AWS_ACCESS_KEY_ID=...
REACT_APP_AWS_SECRET_ACCESS_KEY=...
REACT_APP_AWS_REGION=ap-south-1
REACT_APP_S3_BUCKET=erp-user-docs
```

---

## Summary: Features to Build (Priority Order)

| Priority | Feature | Complexity |
|----------|---------|-----------|
| 1 | Dashboard KPI cards + charts | Medium |
| 2 | Fee Setup (Types, Categories, Structures) | High |
| 3 | Fee Schedules list + detail (5 tabs) | High |
| 4 | Collect Fee (student list + modal) | High |
| 5 | Transactions (Payments, Orders, Refunds tabs) | High |
| 6 | Invoice system (print receipts) | Medium |
| 7 | Reports (20+ report types) | High |
| 8 | Scholarship module | Medium |
| 9 | Bulk upload (Orders + Transactions) | Medium |
| 10 | Reminders & Message Logs | Low |
| 11 | Institution Setup | Medium |
| 12 | User Management | Medium |
| 13 | Accounts/RTGS-NEFT | Medium |
| 14 | Export (CSV + PDF) for all modules | Medium |
