const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed'],
    default: 'uploading'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  filePath: {
    type: String,
    required: true
  },
  parsedContent: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    rows: { type: Number, default: 0 },
    columns: { type: Number, default: 0 },
    fileType: String,
    headers: [String]
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ fileId: 1, userId: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);