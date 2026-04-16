/**
 * Seed exactly ONE dummy record into each collection in the test database.
 * Run: node backend/scripts/seed-one-each.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', mongoose.connection.db.databaseName);

  // ── helpers ──────────────────────────────────────────────────────────────
  const ts = Date.now().toString(36).toUpperCase();
  const rand = () => Math.random().toString(36).slice(2, 5).toUpperCase();

  // ── 1. FeeHead ────────────────────────────────────────────────────────────
  const FeeHead = require('../src/models/fee-head.model');
  if (!(await FeeHead.findOne())) {
    await FeeHead.create({
      fee_head: 'Tuition Fee',
      fee_category: 'Admission Fee',
      fee_priority: 1,
      fee_description: 'Annual tuition fee for regular students',
      fee_nature: 'Mandatory',
      fee_head_status: true,
      module_name: 'Fee',
      app_type: 'Admin',
    });
    console.log('✓ FeeHead seeded');
  } else { console.log('– FeeHead already has data'); }

  // ── 2. FeeCategory ────────────────────────────────────────────────────────
  const FeeCategory = require('../src/models/fee-category.model');
  if (!(await FeeCategory.findOne())) {
    await FeeCategory.create({
      fee_category: 'Admission Fee',
      stream_id: 'BE',
      prefix_invoice: 'INV',
      prefix_receipt: 'REC',
      receipt_generator: 1,
      invoice_generator: 1,
      status: 'active',
      module_name: ['Fee'],
      fee_type: 'GENERAL',
    });
    console.log('✓ FeeCategory seeded');
  } else { console.log('– FeeCategory already has data'); }

  // ── 3. FeeStructure ───────────────────────────────────────────────────────
  const FeeStructure = require('../src/models/fee-structure.model');
  if (!(await FeeStructure.findOne())) {
    await FeeStructure.create({
      stream: 'BE',
      fee_category: 'Admission Fee',
      batch: '2025-2026',
      quota: 'SNQ',
      program: 'Computer Science and Engineering',
      fee_struct_name: 'BE CSE SNQ 2025-26',
      fee_structure: [{ fee_head: 'Tuition Fee', fee_head_amount: 85000 }],
      fee_total_amount: 85000,
    });
    console.log('✓ FeeStructure seeded');
  } else { console.log('– FeeStructure already has data'); }

  // ── 4. FeeSchedule ────────────────────────────────────────────────────────
  const FeeSchedule = require('../src/models/fee-schedule.model');
  if (!(await FeeSchedule.findOne())) {
    await FeeSchedule.create({
      entity: 'fee_schedule',
      fee_category: 'Admission Fee',
      fee_type: 'GENERAL',
      fee_sched_name: 'BE Admission Fee 2025-26',
      academic_year: '2025-2026',
      stream: { stream_code: 'BE', stream_name: 'Bachelor of Engineering' },
      term: 1,
      fee_sched_status: 'active',
      year_of_study: 1,
      fee_particulars: [{ fee_head: 'Tuition Fee', fee_head_priority: 1, fee_head_amount: 85000 }],
      fee_collection_mode: 'both',
    });
    console.log('✓ FeeSchedule seeded');
  } else { console.log('– FeeSchedule already has data'); }

  // ── 5. FeeOrder ───────────────────────────────────────────────────────────
  const FeeOrder = require('../src/models/fee-order.model');
  if (!(await FeeOrder.findOne())) {
    await FeeOrder.create({
      entity: 'fee_order',
      fee_category: 'Admission Fee',
      student_name: 'Rahul Sharma',
      usn: '1JT22CS001',
      fee_particulars: [{ fee_head: 'Tuition Fee', fee_head_amount: 85000 }],
      fee_order_amount: 85000,
      fee_paid_amount: 0,
      order_status: 'created',
      attempts: 0,
    });
    console.log('✓ FeeOrder seeded');
  } else { console.log('– FeeOrder already has data'); }

  // ── 6. FeeTransaction ─────────────────────────────────────────────────────
  const FeeTransaction = require('../src/models/fee-transaction.model');
  if (!(await FeeTransaction.findOne())) {
    await FeeTransaction.create({
      entity: 'fee_transaction',
      pay_amount: 85000,
      pay_status: 'captured',
      order_custom_id: `ORD-${ts}`,
      receipt_no: `REC-${ts}`,
      method: 'Cash',
      captured_date: new Date(),
      student_name: 'Rahul Sharma',
      usn: '1JT22CS001',
    });
    console.log('✓ FeeTransaction seeded');
  } else { console.log('– FeeTransaction already has data'); }

  // ── 7. PayRecord ──────────────────────────────────────────────────────────
  const PayRecord = require('../src/models/pay-record.model');
  if (!(await PayRecord.findOne())) {
    await PayRecord.create({
      name: 'Rahul Sharma',
      bank_name: 'State Bank of India',
      ref_no: `REF-${ts}`,
      transaction_date: new Date(),
      transaction_amount: 85000,
      status: 'captured',
      method: 'Cash',
      description: 'Tuition fee payment for Sem 1',
      financial_year: '2025-2026',
    });
    console.log('✓ PayRecord seeded');
  } else { console.log('– PayRecord already has data'); }

  // ── 8. FeeRefund ──────────────────────────────────────────────────────────
  const FeeRefund = require('../src/models/fee-refund.model');
  if (!(await FeeRefund.findOne())) {
    await FeeRefund.create({
      refund_amount: 5000,
      method: 'NEFT',
      refund_status: 'pending',
      student_name: 'Rahul Sharma',
    });
    console.log('✓ FeeRefund seeded');
  } else { console.log('– FeeRefund already has data'); }

  // ── 9. Scholarship ────────────────────────────────────────────────────────
  const Scholarship = require('../src/models/scholarship.model');
  if (!(await Scholarship.findOne())) {
    await Scholarship.create({
      academic_year: '2025-2026',
      application_no: `SCH-${ts}`,
      scholarship_amount: 20000,
      scholarship_status: 'approved',
      term: 1,
      student_name: 'Priya Patel',
    });
    console.log('✓ Scholarship seeded');
  } else { console.log('– Scholarship already has data'); }

  // ── 10. BankLoan ──────────────────────────────────────────────────────────
  const BankLoan = require('../src/models/bank-loan.model');
  if (!(await BankLoan.findOne())) {
    await BankLoan.create({
      student_name: 'Anil Kumar',
      bank_name: 'State Bank of India',
      account_number: '3874562910',
      reference_number: `BL-${ts}`,
      loan_date: new Date('2025-06-15'),
      amount: 200000,
      loan_type: 'Education Loan',
      status: 'active',
      notes: 'Education loan for 4-year BE program',
    });
    console.log('✓ BankLoan seeded');
  } else { console.log('– BankLoan already has data'); }

  // ── 11. GeneralStudent ────────────────────────────────────────────────────
  const GeneralStudent = require('../src/models/general-student.model');
  if (!(await GeneralStudent.findOne())) {
    await GeneralStudent.create({
      name: 'Sneha Reddy',
      mobile_number: '9876543210',
      email: 'sneha.reddy@example.com',
      stream: 'BE',
      program: 'Electronics and Communication Engineering',
      status: 'Active',
    });
    console.log('✓ GeneralStudent seeded');
  } else { console.log('– GeneralStudent already has data'); }

  // ── 12. BillingCustomer ───────────────────────────────────────────────────
  const BillingCustomer = require('../src/models/billing-customer.model');
  if (!(await BillingCustomer.findOne())) {
    await BillingCustomer.create({
      name: 'Jnana Ganga Institute',
      mobile_number: '9845012345',
      email: 'accounts@jgit.edu.in',
      stream: 'BE',
      program: 'Computer Science and Engineering',
      status: 'Active',
    });
    console.log('✓ BillingCustomer seeded');
  } else { console.log('– BillingCustomer already has data'); }

  // ── 13. BillingOrder ──────────────────────────────────────────────────────
  const BillingOrder = require('../src/models/billing-order.model');
  if (!(await BillingOrder.findOne())) {
    await BillingOrder.create({
      entity: 'billing_order',
      fee_category: 'Admission Fee',
      customer_name: 'Jnana Ganga Institute',
      customer_id: 'CUS-001',
      fee_order_amount: 50000,
      order_status: 'created',
      module_name: 'Billing',
      description: 'Annual library subscription',
    });
    console.log('✓ BillingOrder seeded');
  } else { console.log('– BillingOrder already has data'); }

  // ── 14. BillingTransaction ────────────────────────────────────────────────
  const BillingTransaction = require('../src/models/billing-transaction.model');
  if (!(await BillingTransaction.findOne())) {
    await BillingTransaction.create({
      pay_amount: 50000,
      pay_status: 'captured',
      method: 'NEFT',
      captured_date: new Date(),
      customer_name: 'Jnana Ganga Institute',
      module_name: 'Billing',
    });
    console.log('✓ BillingTransaction seeded');
  } else { console.log('– BillingTransaction already has data'); }

  // ── 15. BillingPayRecord ─────────────────────────────────────────────────
  const BillingPayRecord = mongoose.model(
    'BillingPayRecord',
    new mongoose.Schema(
      {
        name: String,
        ref_no: String,
        transaction_date: Date,
        transaction_amount: Number,
        status: { type: String, default: 'captured' },
        method: String,
        description: String,
      },
      { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
    ),
    'billingpayrecords'
  );
  if (!(await BillingPayRecord.findOne())) {
    await BillingPayRecord.create({
      name: 'Jnana Ganga Institute',
      ref_no: `BREF-${ts}`,
      transaction_date: new Date(),
      transaction_amount: 50000,
      status: 'captured',
      method: 'NEFT',
      description: 'Library subscription payment',
    });
    console.log('✓ BillingPayRecord seeded');
  } else { console.log('– BillingPayRecord already has data'); }

  await mongoose.disconnect();
  console.log('\nDone. All collections seeded (1 record each).');
}

main().catch((err) => { console.error(err); process.exit(1); });
