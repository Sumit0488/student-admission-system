const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({ name: String }, { timestamps: true });

module.exports = mongoose.model("Test", testSchema);
