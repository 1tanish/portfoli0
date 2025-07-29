const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema({
  text: String,
  date: String,
});

module.exports = mongoose.model("Update", updateSchema);
