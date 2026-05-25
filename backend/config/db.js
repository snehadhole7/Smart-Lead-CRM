import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_lead_crm';

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Local MongoDB connection failed, falling back to in-memory MongoDB for development...');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('In-memory MongoDB connected');
      return;
    }

    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
