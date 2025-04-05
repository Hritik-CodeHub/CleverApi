const mongoose = require("mongoose");

const PaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paper", PaperSchema);
