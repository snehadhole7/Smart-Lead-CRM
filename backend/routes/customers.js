import express from 'express';
import asyncHandler from 'express-async-handler';
import Customer from '../models/Customer.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, status } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter);
    res.json(customers);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, company, email, phone, status, nextCheckIn } = req.body;
    const customer = await Customer.create({
      name,
      company,
      email,
      phone,
      status,
      nextCheckIn: nextCheckIn ? new Date(nextCheckIn) : undefined,
    });
    res.status(201).json(customer);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    const { name, company, email, phone, status, nextCheckIn } = req.body;
    customer.name = name || customer.name;
    customer.company = company || customer.company;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;
    customer.status = status || customer.status;
    customer.nextCheckIn = nextCheckIn ? new Date(nextCheckIn) : customer.nextCheckIn;
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    await customer.remove();
    res.json({ message: 'Customer deleted' });
  })
);

export default router;
