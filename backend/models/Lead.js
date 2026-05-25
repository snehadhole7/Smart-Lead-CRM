import mongoose from 'mongoose';

const leadSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    contact: { type: String, required: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Lost'],
      default: 'New',
    },
    notes: {
      type: String,
      default: '',
    },
    nextFollowUp: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
