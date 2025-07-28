const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  status: String,
  date: Date,
});

module.exports = mongoose.model("Status", statusSchema);
