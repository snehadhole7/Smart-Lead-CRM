import express from 'express';
import asyncHandler from 'express-async-handler';
import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, status, followUpDue } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }

    if (followUpDue === 'true') {
      const now = new Date();
      const upcoming = new Date();
      upcoming.setDate(now.getDate() + 7);
      filter.nextFollowUp = { $gte: now, $lte: upcoming };
    }

    const leads = await Lead.find(filter).populate('assignedTo', 'name email role');
    res.json(leads);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, company, contact, status, notes, nextFollowUp } = req.body;
    const leadData = {
      name,
      company,
      contact,
      status,
      notes: notes || '',
      assignedTo: req.user._id,
    };
    if (nextFollowUp) {
      leadData.nextFollowUp = new Date(nextFollowUp);
    }
    const lead = await Lead.create(leadData);
    res.status(201).json(lead);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    const { name, company, contact, status, notes, nextFollowUp } = req.body;
    lead.name = name || lead.name;
    lead.company = company || lead.company;
    lead.contact = contact || lead.contact;
    lead.status = status || lead.status;
    lead.notes = notes != null ? notes : lead.notes;
    lead.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : lead.nextFollowUp;
    const updatedLead = await lead.save();
    res.json(updatedLead);
  })
);

router.post(
  '/:id/convert',
  asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    if (lead.status !== 'Qualified') {
      res.status(400);
      throw new Error('Lead must be Qualified before conversion');
    }

    const normalizedName = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '.');
    const normalizedCompany = lead.company.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'client';
    const email = lead.contact && lead.contact.includes('@')
      ? lead.contact
      : `${normalizedName}@${normalizedCompany}.com`;
    const phone = lead.contact && !lead.contact.includes('@') ? lead.contact : '';

    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + 7);

    const customer = await Customer.create({
      name: lead.name,
      company: lead.company,
      email,
      phone: phone || 'N/A',
      status: 'Active',
      nextCheckIn,
    });

    lead.status = 'Qualified';
    await lead.save();

    res.status(201).json({ customer, lead });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    await lead.remove();
    res.json({ message: 'Lead deleted' });
  })
);

router.get(
  '/reminders',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + 7);
    const reminders = await Lead.find({
      nextFollowUp: { $gte: now, $lte: upcoming },
    }).populate('assignedTo', 'name email');
    res.json(reminders);
  })
);

export default router;
