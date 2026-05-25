import mongoose from 'mongoose';

const customerSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'At Risk', 'Closed'],
      default: 'Active',
    },
    nextCheckIn: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
