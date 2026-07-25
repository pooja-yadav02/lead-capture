const mongoose = require('mongoose');

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $15,000',
  '$15,000 - $50,000',
  '$50,000+'
];

const STATUSES = ['New', 'Contacted', 'Closed'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be under 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email is too long']
    },
    budgetRange: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: {
        values: BUDGET_RANGES,
        message: 'Please select a valid budget range'
      }
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message must be under 2000 characters']
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Status must be New, Contacted, or Closed'
      },
      default: 'New'
    }
  },
  { timestamps: true }
);

leadSchema.index({ name: 'text', email: 'text', message: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
module.exports.BUDGET_RANGES = BUDGET_RANGES;
module.exports.STATUSES = STATUSES;
