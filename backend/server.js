import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import customerRoutes from './routes/customers.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const seedAdmin = async () => {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (!existing) {
    const password = await bcrypt.hash('Password123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+15550100',
      password,
      role: 'admin',
    });
    console.log('Default admin user created: admin@example.com or +15550100 / Password123');
  } else if (!existing.phone) {
    existing.phone = '+15550100';
    await existing.save();
  }
};

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/reports', reportRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Smart Lead CRM backend is running' });
  });

  app.use((err, req, res, next) => {
    const status = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(status).json({ message: err.message, stack: process.env.NODE_ENV === 'production' ? null : err.stack });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Backend running on http://127.0.0.1:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});
