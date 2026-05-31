const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'tool'], required: true },
  content: { type: String, required: true },
  tool_calls: [{
    id: String,
    name: String,
    args: String
  }],
  timestamp: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  threadId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [MessageSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);
