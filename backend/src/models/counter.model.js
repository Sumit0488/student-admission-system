const mongoose = require('mongoose');

// Stores an auto-incrementing sequence per USN prefix (e.g. "STU-2024-CSE")
const counterSchema = new mongoose.Schema({
  _id:  { type: String },   // the prefix key
  seq:  { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
