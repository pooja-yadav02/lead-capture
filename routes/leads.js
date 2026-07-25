const express = require('express');
const validator = require('validator');
const Lead = require('../models/Lead');

const router = express.Router();

// --- Server-side validation (never trust the client) ---
function validateLeadInput(body) {
  const errors = {};
  const { name, email, budgetRange, message } = body || {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be under 100 characters.';
  }

  if (typeof email !== 'string' || !validator.isEmail(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  const validBudgets = Lead.BUDGET_RANGES;
  if (typeof budgetRange !== 'string' || !validBudgets.includes(budgetRange)) {
    errors.budgetRange = 'Please select a valid budget range.';
  }

  if (typeof message !== 'string' || message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (message.trim().length > 2000) {
    errors.message = 'Message must be under 2000 characters.';
  }

  return errors;
}

// POST /api/leads - public form submission
router.post('/', async (req, res) => {
  try {
    const errors = validateLeadInput(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const lead = await Lead.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      budgetRange: req.body.budgetRange,
      message: req.body.message.trim()
    });

    return res.status(201).json({ success: true, lead });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = {};
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ success: false, errors });
    }
    console.error('Error creating lead:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/leads - admin list, with optional search + status filter
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status && Lead.STATUSES.includes(status)) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { message: { $regex: term, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, leads });
  } catch (err) {
    console.error('Error fetching leads:', err);
    return res.status(500).json({ success: false, message: 'Could not load leads.' });
  }
});

// PATCH /api/leads/:id - update status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!Lead.STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    return res.json({ success: true, lead });
  } catch (err) {
    console.error('Error updating lead:', err);
    return res.status(500).json({ success: false, message: 'Could not update lead.' });
  }
});

module.exports = router;
