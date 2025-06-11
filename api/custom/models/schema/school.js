const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema(
  {
    school: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
    },
    expiredDate: {
      type: Date,
      required: true,
    },
    maxUsers: {
      type: Number,
      min: 0,
    },
    monthlyCredits: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

const School = mongoose.models.School || mongoose.model('School', SchoolSchema);

module.exports = School;