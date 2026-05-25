import express from 'express';
import asyncHandler from 'express-async-handler';
import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const totalLeads = await Lead.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const followUps = await Lead.countDocuments({ status: { $in: ['Contacted', 'Qualified'] } });
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + 7);
    const upcomingFollowUps = await Lead.countDocuments({
      nextFollowUp: { $gte: now, $lte: upcoming },
    });
    const conversionRate = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;

    res.json({
      totalLeads,
      totalCustomers,
      followUps,
      upcomingFollowUps,
      conversionRate,
    });
  })
);

router.get(
  '/checkins',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + 7);
    const checkins = await Customer.find({
      nextCheckIn: { $gte: now, $lte: upcoming },
    }).sort({ nextCheckIn: 1 });
    res.json(checkins);
  })
);

export default router;
