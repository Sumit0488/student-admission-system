/**
 * Seed script — inserts 2 dummy records into every new collection.
 * Run: node scripts/seed-fee-general-billing.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

// ── Models ────────────────────────────────────────────────────────────────────
const FeeHead        = require('../src/models/fee-head.model');
const FeeCategory    = require('../src/models/fee-category.model');
const FeeStructure   = require('../src/models/fee-structure.model');
const FeeSchedule    = require('../src/models/fee-schedule.model');
const FeeOrder       = require('../src/models/fee-order.model');
const FeeTransaction = require('../src/models/fee-transaction.model');
const PayRecord      = require('../src/models/pay-record.model');
const FeeRefund      = require('../src/models/fee-refund.model');
const Scholarship    = require('../src/models/scholarship.model');
const BankLoan       = require('../src/models/bank-loan.model');
const GeneralStudent = require('../src/models/general-student.model');
const BillingCustomer   = require('../src/models/billing-customer.model');
const BillingOrder      = require('../src/models/billing-order.model');
const BillingTransaction= require('../src/models/billing-transaction.model');

async function seed() {
  console.log('Connecting to MongoDB Atlas…');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // ── Fee Heads ──────────────────────────────────────────────────────────────
  const feeHeads = await FeeHead.insertMany([
    {
      fee_category: 'Admission',
      fee_head: 'Tuition Fee',
      fee_priority: 1,
      fee_description: 'College tuition fees charged per semester',
      fee_nature: 'Compulsory',
      fee_head_status: true,
      module_name: 'Fee',
    },
    {
      fee_category: 'Admission',
      fee_head: 'Development Fee',
      fee_priority: 2,
      fee_description: 'College development and infrastructure fee',
      fee_nature: 'Compulsory',
      fee_head_status: true,
      module_name: 'Fee',
    },
  ]);
  console.log('✔  FeeHead         —', feeHeads.length, 'records');

  // ── Fee Categories ─────────────────────────────────────────────────────────
  const feeCategories = await FeeCategory.insertMany([
    {
      fee_category: 'Admission',
      stream_id: 'BE',
      default_category: true,
      prefix_invoice: 'INV',
      prefix_receipt: 'REC',
      status: 'active',
      module_name: ['Fee'],
      fee_type: 'GENERAL',
    },
    {
      fee_category: 'General fee',
      stream_id: 'BE',
      default_category: false,
      prefix_invoice: 'GINV',
      prefix_receipt: 'GREC',
      status: 'active',
      module_name: ['Billing'],
      fee_type: 'GENERAL',
    },
  ]);
  console.log('✔  FeeCategory     —', feeCategories.length, 'records');

  // ── Fee Structures ─────────────────────────────────────────────────────────
  const feeStructures = await FeeStructure.insertMany([
    {
      stream: 'BE',
      fee_category: 'Admission',
      batch: '2026-2030',
      quota: 'General',
      program: 'Computer Science and Engineering',
      fee_struct_name: 'BE-CSE General 2026',
      fee_structure: [
        { fee_head: 'Tuition Fee',   fee_priority: 1, fee_head_amount: 50000 },
        { fee_head: 'Development Fee', fee_priority: 2, fee_head_amount: 10000 },
      ],
      fee_total_amount: 60000,
      admission_type: 'Regular',
      module_name: 'Fee',
    },
    {
      stream: 'BE',
      fee_category: 'Admission',
      batch: '2026-2030',
      quota: 'Management',
      program: 'Mechanical Engineering',
      fee_struct_name: 'BE-ME Management 2026',
      fee_structure: [
        { fee_head: 'Tuition Fee',   fee_priority: 1, fee_head_amount: 75000 },
        { fee_head: 'Development Fee', fee_priority: 2, fee_head_amount: 15000 },
      ],
      fee_total_amount: 90000,
      admission_type: 'Regular',
      module_name: 'Fee',
    },
  ]);
  console.log('✔  FeeStructure    —', feeStructures.length, 'records');

  // ── Fee Schedules ──────────────────────────────────────────────────────────
  const feeSchedules = await FeeSchedule.insertMany([
    {
      entity: 'admission',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      fee_sched_name: 'BE Admission Fee 2026-27',
      academic_year: '2026-2027',
      stream: { stream_code: 'BE', stream_name: 'Bachelor Of Engineering' },
      term: 1,
      year_of_study: 1,
      start_date: new Date('2026-06-01'),
      end_date: new Date('2026-07-31'),
      fee_sched_status: 'active',
      fee_collection_mode: 'both',
      fee_particulars: [
        { fee_head: 'Tuition Fee',    fee_head_priority: 1, fee_head_amount: 50000 },
        { fee_head: 'Development Fee', fee_head_priority: 2, fee_head_amount: 10000 },
      ],
      module_name: 'Fee',
      batch_name: '2026-2030',
    },
    {
      entity: 'admission',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      fee_sched_name: 'BE Admission Fee 2025-26',
      academic_year: '2025-2026',
      stream: { stream_code: 'BE', stream_name: 'Bachelor Of Engineering' },
      term: 1,
      year_of_study: 1,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-07-31'),
      fee_sched_status: 'active',
      fee_collection_mode: 'both',
      fee_particulars: [
        { fee_head: 'Tuition Fee',    fee_head_priority: 1, fee_head_amount: 48000 },
        { fee_head: 'Development Fee', fee_head_priority: 2, fee_head_amount: 9000  },
      ],
      module_name: 'Fee',
      batch_name: '2025-2029',
    },
  ]);
  console.log('✔  FeeSchedule     —', feeSchedules.length, 'records');

  // ── Fee Orders ─────────────────────────────────────────────────────────────
  const feeOrders = await FeeOrder.insertMany([
    {
      entity: 'Customer',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      academic_year: '2026-2027',
      student_name: 'Vikas Patil',
      usn: 'SD004',
      user_email: 'vikas.patil@example.com',
      term: 1,
      year_of_study: 1,
      stream_id: 'BE',
      fee_particulars: [
        { fee_head: 'Tuition Fee',    fee_head_priority: 1, fee_head_amount: 50000, fee_head_paid: 50000, fee_head_due: 0, fee_head_discount: 0, fee_head_status: 'paid' },
        { fee_head: 'Development Fee', fee_head_priority: 2, fee_head_amount: 10000, fee_head_paid: 10000, fee_head_due: 0, fee_head_discount: 0, fee_head_status: 'paid' },
      ],
      fee_order_amount: 60000,
      fee_paid_amount: 60000,
      fee_due_amount: 0,
      fee_discount: 0,
      order_status: 'paid',
      attempts: 1,
      module_name: 'Fee',
      app_type: 'Admin',
    },
    {
      entity: 'Customer',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      academic_year: '2026-2027',
      student_name: 'Varun Patil',
      usn: 'SD003',
      user_email: 'varun.patil@example.com',
      term: 1,
      year_of_study: 1,
      stream_id: 'BE',
      fee_particulars: [
        { fee_head: 'Tuition Fee',    fee_head_priority: 1, fee_head_amount: 50000, fee_head_paid: 25000, fee_head_due: 25000, fee_head_discount: 0, fee_head_status: 'partial' },
        { fee_head: 'Development Fee', fee_head_priority: 2, fee_head_amount: 10000, fee_head_paid: 0,     fee_head_due: 10000, fee_head_discount: 0, fee_head_status: 'unpaid'  },
      ],
      fee_order_amount: 60000,
      fee_paid_amount: 25000,
      fee_due_amount: 35000,
      fee_discount: 0,
      order_status: 'created',
      attempts: 1,
      module_name: 'Fee',
      app_type: 'Admin',
    },
  ]);
  console.log('✔  FeeOrder        —', feeOrders.length, 'records');

  // ── Fee Transactions ───────────────────────────────────────────────────────
  const feeTransactions = await FeeTransaction.insertMany([
    {
      entity: 'Customer',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      pay_amount: 60000,
      pay_status: 'captured',
      order_custom_id: feeOrders[0].order_id,
      receipt_no: 'REC-2026-001',
      pay_records: [
        { fee_head: 'Tuition Fee',    amount_paid: 50000 },
        { fee_head: 'Development Fee', amount_paid: 10000 },
      ],
      method: 'online',
      mode: 'upi',
      captured_date: new Date('2026-03-19'),
      student_name: 'Vikas Patil',
      usn: 'SD004',
      user_email: 'vikas.patil@example.com',
      term: '1',
      stream_id: 'BE',
      module_name: 'Fee',
      app_type: 'Admin',
    },
    {
      entity: 'Customer',
      fee_category: 'Admission',
      fee_type: 'GENERAL',
      pay_amount: 25000,
      pay_status: 'captured',
      order_custom_id: feeOrders[1].order_id,
      receipt_no: 'REC-2026-002',
      pay_records: [
        { fee_head: 'Tuition Fee', amount_paid: 25000 },
      ],
      method: 'offline',
      mode: 'cash',
      captured_date: new Date('2026-03-20'),
      student_name: 'Varun Patil',
      usn: 'SD003',
      user_email: 'varun.patil@example.com',
      term: '1',
      stream_id: 'BE',
      module_name: 'Fee',
      app_type: 'Admin',
    },
  ]);
  console.log('✔  FeeTransaction  —', feeTransactions.length, 'records');

  // ── Pay Records ────────────────────────────────────────────────────────────
  const payRecords = await PayRecord.insertMany([
    {
      name: 'Hemanth',
      bank_name: 'State Bank of India',
      ref_no: 'Ref 2200',
      transaction_date: new Date('2025-09-22'),
      transaction_amount: 10000,
      status: 'captured',
      description: 'Semester fee payment',
      method: 'NEFT',
      module_name: 'Fee',
      app_type: 'Admin',
    },
    {
      name: 'Vikas',
      bank_name: 'HDFC Bank',
      ref_no: 'Ref 20',
      transaction_date: new Date('2025-09-22'),
      transaction_amount: 30000,
      status: 'captured',
      description: 'Annual fee payment',
      method: 'RTGS',
      module_name: 'Fee',
      app_type: 'Admin',
    },
  ]);
  console.log('✔  PayRecord       —', payRecords.length, 'records');

  // ── Fee Refunds ────────────────────────────────────────────────────────────
  const feeRefunds = await FeeRefund.insertMany([
    {
      entity: 'refund',
      refund_amount: 5000,
      receipt_no: 'REF-2026-001',
      description: 'Excess fee refund for Vikas Patil',
      method: 'bank_transfer',
      offline_ref: 'RTGS-REF-001',
      refund_status: 'processed',
      student_name: 'Vikas Patil',
      usn: 'SD004',
      user_email: 'vikas.patil@example.com',
      refund_date: new Date('2026-03-25'),
      stream_id: 'BE',
      fee_type: 'GENERAL',
      module_name: 'Fee',
      app_type: 'Admin',
    },
    {
      entity: 'refund',
      refund_amount: 2000,
      receipt_no: 'REF-2026-002',
      description: 'Cancelled registration refund',
      method: 'bank_transfer',
      offline_ref: 'NEFT-REF-002',
      refund_status: 'pending',
      student_name: 'Rahim Kumar',
      usn: 'SD005',
      user_email: 'rahim.kumar@example.com',
      refund_date: new Date('2026-03-28'),
      stream_id: 'BE',
      fee_type: 'GENERAL',
      module_name: 'Fee',
      app_type: 'Admin',
    },
  ]);
  console.log('✔  FeeRefund       —', feeRefunds.length, 'records');

  // ── Scholarships ───────────────────────────────────────────────────────────
  const scholarships = await Scholarship.insertMany([
    {
      academic_year: '2026-2027',
      application_no: 'APP_1001',
      scholarship_amount: 25000,
      ref_no: 'REF-SCH-001',
      scholarship_paid_to_student: 25000,
      scholarship_refno_to_student: 'NEFT-SCH-001',
      scholarship_paid_to_college: 0,
      scholarship_status: 'Sanctioned',
      term: 1,
      created_by: { user_email: 'admin@college.edu', user_name: 'Admin' },
    },
    {
      academic_year: '2026-2027',
      application_no: 'APP_1002',
      scholarship_amount: 15000,
      ref_no: 'REF-SCH-002',
      scholarship_paid_to_student: 0,
      scholarship_paid_to_college: 0,
      scholarship_status: 'Applied',
      term: 1,
      created_by: { user_email: 'admin@college.edu', user_name: 'Admin' },
    },
  ]);
  console.log('✔  Scholarship     —', scholarships.length, 'records');

  // ── Bank Loans ─────────────────────────────────────────────────────────────
  const bankLoans = await BankLoan.insertMany([
    {
      student_name: 'General User',
      bank_name: 'State Bank of India',
      account_number: '1234567890',
      reference_number: '123456',
      loan_date: new Date('2025-08-11'),
      amount: 150000,
      loan_type: 'Student Loan',
      status: 'active',
      notes: 'Education loan for BE program',
    },
    {
      student_name: 'Varun Patil',
      bank_name: 'HDFC Bank',
      account_number: '9876543210',
      reference_number: '654321',
      loan_date: new Date('2025-09-01'),
      amount: 200000,
      loan_type: 'Education Loan',
      status: 'active',
      notes: 'Education loan for BE-CSE program',
    },
  ]);
  console.log('✔  BankLoan        —', bankLoans.length, 'records');

  // ── General Students ───────────────────────────────────────────────────────
  const generalStudents = await GeneralStudent.insertMany([
    {
      name: 'General User',
      mobile_number: '9876543000',
      email: 'general_user001@gmail.com',
      stream: 'BE',
      program: 'CSE',
      status: 'Active',
      batch: '2026-2030',
    },
    {
      name: 'General User 2',
      mobile_number: '9876543001',
      email: 'general_user002@gmail.com',
      stream: 'BE',
      program: 'CSE',
      status: 'Active',
      batch: '2026-2030',
    },
  ]);
  console.log('✔  GeneralStudent  —', generalStudents.length, 'records');

  // ── Billing Customers ──────────────────────────────────────────────────────
  const billingCustomers = await BillingCustomer.insertMany([
    {
      name: 'Rajath',
      mobile_number: '9999999999',
      email: '1bd24@gmail.com',
      stream: 'BE',
      program: 'BCom',
      status: 'Active',
    },
    {
      name: 'Customer 16',
      mobile_number: '7349046015',
      email: 'customer16@gmail.com',
      stream: 'BE',
      program: 'IS',
      status: 'Active',
    },
  ]);
  console.log('✔  BillingCustomer —', billingCustomers.length, 'records');

  // ── Billing Orders ─────────────────────────────────────────────────────────
  const billingOrders = await BillingOrder.insertMany([
    {
      entity: 'Customer',
      fee_category: 'General fee',
      fee_type: 'GENERAL',
      academic_year: '2026-2027',
      student_name: 'Rajath',
      usn: 'RJV001',
      user_email: '1bd24@gmail.com',
      customer_crm_id: billingCustomers[0].customer_id,
      fee_order_amount: 2000,
      fee_paid_amount: 2000,
      fee_due_amount: 0,
      order_status: 'paid',
      attempts: 1,
      module_name: 'Billing',
      app_type: 'Admin',
      fee_particulars: [
        { fee_head: 'General fee', fee_head_priority: 1, fee_head_amount: 2000, fee_head_paid: 2000, fee_head_due: 0, fee_head_discount: 0, fee_head_status: 'paid' },
      ],
    },
    {
      entity: 'Customer',
      fee_category: 'General fee',
      fee_type: 'GENERAL',
      academic_year: '2026-2027',
      student_name: 'Customer 16',
      usn: 'C0016',
      user_email: 'customer16@gmail.com',
      customer_crm_id: billingCustomers[1].customer_id,
      fee_order_amount: 100,
      fee_paid_amount: 100,
      fee_due_amount: 0,
      order_status: 'paid',
      attempts: 1,
      module_name: 'Billing',
      app_type: 'Admin',
      fee_particulars: [
        { fee_head: 'General fee', fee_head_priority: 1, fee_head_amount: 100, fee_head_paid: 100, fee_head_due: 0, fee_head_discount: 0, fee_head_status: 'paid' },
      ],
    },
  ]);
  console.log('✔  BillingOrder    —', billingOrders.length, 'records');

  // ── Billing Transactions ───────────────────────────────────────────────────
  const billingTransactions = await BillingTransaction.insertMany([
    {
      entity: 'Customer',
      fee_category: 'General fee',
      fee_type: 'GENERAL',
      pay_amount: 2000,
      pay_status: 'captured',
      order_custom_id: billingOrders[0].order_id,
      receipt_no: 'BREC-2026-001',
      pay_records: [{ fee_head: 'General fee', amount_paid: 2000 }],
      method: 'online',
      mode: 'upi',
      captured_date: new Date('2026-03-19'),
      student_name: 'Rajath',
      usn: 'RJV001',
      user_email: '1bd24@gmail.com',
      customer_crm_id: billingCustomers[0].customer_id,
      module_name: 'Billing',
      app_type: 'Admin',
    },
    {
      entity: 'Customer',
      fee_category: 'General fee',
      fee_type: 'GENERAL',
      pay_amount: 100,
      pay_status: 'captured',
      order_custom_id: billingOrders[1].order_id,
      receipt_no: 'BREC-2026-002',
      pay_records: [{ fee_head: 'General fee', amount_paid: 100 }],
      method: 'online',
      mode: 'netbanking',
      captured_date: new Date('2026-02-18'),
      student_name: 'Customer 16',
      usn: 'C0016',
      user_email: 'customer16@gmail.com',
      customer_crm_id: billingCustomers[1].customer_id,
      module_name: 'Billing',
      app_type: 'Admin',
    },
  ]);
  console.log('✔  BillingTransaction —', billingTransactions.length, 'records');

  console.log('\n✅  Seed complete — 2 records inserted into each of 14 collections.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
