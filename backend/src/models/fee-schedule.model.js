const mongoose = require('mongoose');

const generateFeeId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FEE-${ts}-${rand}`;
};

const feeScheduleSchema = new mongoose.Schema(
  {
    institution_id: { type: String, trim: true },
    fee_id: { type: String, unique: true, default: generateFeeId },
    entity: { type: String, required: true, trim: true, default: 'fee_schedule' },
    fee_category: { type: String, required: true, trim: true },
    fee_type: { type: String, enum: ['GENERAL', 'EXAM', 'REVAL'], default: 'GENERAL' },
    fee_sched_name: { type: String, trim: true, default: '' },
    academic_year: { type: String, required: true, trim: true },
    stream: {
      stream_code: { type: String, trim: true },
      stream_name: { type: String, trim: true },
    },
    term: { type: Number },
    program: [{ type: String }],
    start_date: { type: Date },
    end_date: { type: Date },
    fee_sched_status: { type: String, default: 'draft' },
    year_of_study: { type: Number },
    stream_id: { type: String, trim: true },
    fee_particulars: [
      {
        fee_head: { type: String, trim: true },
        fee_head_priority: { type: Number },
        fee_head_amount: { type: Number, default: 0 },
      },
    ],
    fee_collection_mode: {
      type: String,
      enum: ['offline', 'online', 'both', 'stop'],
      default: 'both',
    },
    semester: { type: String, trim: true, default: '' },
    min_amount: { type: Number, default: 0 },
    payment_type: { type: String, enum: ['partial', 'full', 'both'], default: 'both' },
    notify_sms: { type: Boolean, default: false },
    notify_email: { type: Boolean, default: false },
    module_name: { type: String, trim: true, default: 'Fee' },
    app_type: { type: String, trim: true, default: 'Admin' },
    batch_name: { type: String, trim: true, default: '' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
},
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const FeeSchedule = mongoose.model('FeeSchedule', feeScheduleSchema);
module.exports = FeeSchedule;
