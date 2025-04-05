const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of enrolled students
    papers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Paper" }], // Question papers in this class
  },
  { timestamps: true }
);

module.exports = mongoose.model("classSchema", ClassSchema);
