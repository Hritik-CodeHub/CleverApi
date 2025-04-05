const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },
    text: { type: String, required: true },
    answere: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
