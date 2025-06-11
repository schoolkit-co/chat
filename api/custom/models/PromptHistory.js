const mongoose = require('mongoose');

const promptHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  history: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
}, {
  timestamps: true
});

const PromptHistory = mongoose.model('PromptHistory', promptHistorySchema, 'prompthistories');

module.exports = PromptHistory; 