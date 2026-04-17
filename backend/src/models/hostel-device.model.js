const mongoose = require('mongoose');

const hostelDeviceSchema = new mongoose.Schema({
  device_id:    { type: String, unique: true },
  device_name:  { type: String, required: true },
  device_type:  { type: String, enum: ['Fan', 'Heater', 'Extension Board', 'AC', 'TV', 'Laptop', 'Mobile Charger', 'Refrigerator', 'Other'], default: 'Other' },
  serial_number:{ type: String },
  brand:        { type: String },
  hostel_name:  { type: String },
  room_number:  { type: String },
  hostel_student_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelStudent' },
  student_name: { type: String },
  usn:          { type: String },
  assigned_date:{ type: Date },
  return_date:  { type: Date },
  status:       { type: String, enum: ['Available', 'Assigned', 'Under Maintenance', 'Damaged', 'Lost'], default: 'Available' },
  condition:    { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
  remarks:      { type: String },
  added_by:     { type: String, default: 'Admin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
}, { timestamps: true });

hostelDeviceSchema.pre('save', async function () {
  if (!this.device_id) {
    const count = await mongoose.model('HostelDevice').countDocuments();
    this.device_id = `DEV-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('HostelDevice', hostelDeviceSchema);
