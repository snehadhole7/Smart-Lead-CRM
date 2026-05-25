import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();
const otpStore = new Map();
const signupOtpStore = new Map();

const normalizePhone = (phone = '') => phone.replace(/[^\d+]/g, '');
const isDemoOtpMode = () => process.env.OTP_DEMO_MODE === 'true';
const getSignupIdentifier = (email, phone, channel) => {
  return channel === 'phone' ? normalizePhone(phone) : String(email || '').trim().toLowerCase();
};
const requireEnv = (keys, label) => {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`${label} setup missing in backend/.env: ${missing.join(', ')}`);
  }
};

const sendEmailOtp = async (email, otp) => {
  requireEnv(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'], 'Email OTP');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Smart Lead CRM OTP',
    text: `Your Smart Lead CRM OTP is ${otp}. It expires in 5 minutes.`,
  });
};

const sendSmsOtp = async (phone, otp) => {
  requireEnv(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_PHONE'], 'SMS OTP');
  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({
    To: phone,
    From: process.env.TWILIO_FROM_PHONE,
    Body: `Your Smart Lead CRM OTP is ${otp}. It expires in 5 minutes.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'SMS OTP failed to send');
  }
};

const sendOtpByChannel = async ({ channel, destination, otp }) => {
  if (isDemoOtpMode()) return;

  if (channel === 'phone') {
    await sendSmsOtp(destination, otp);
    return;
  }
  await sendEmailOtp(destination, otp);
};

const findUserByIdentifier = async (identifier) => {
  const value = String(identifier || '').trim();
  if (!value) return null;
  const phone = normalizePhone(value);
  return User.findOne({
    $or: [{ email: value.toLowerCase() }, { phone }, { phone: value }],
  });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '30d' });
};

const sendAuthResponse = (res, user) => {
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, phone, password, role, otpChannel } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const selectedChannel = otpChannel === 'phone' ? 'phone' : 'email';
    const signupIdentifier = getSignupIdentifier(email, phone, selectedChannel);
    const signupOtpKey = `${selectedChannel}:${signupIdentifier}`;
    const signupOtpRecord = signupOtpStore.get(signupOtpKey);

    if (!signupOtpRecord?.verified) {
      res.status(400);
      throw new Error('Please verify signup OTP first');
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });
    if (existingUser) {
      res.status(400);
      throw new Error(existingUser.email === email ? 'Email already registered' : 'Phone number already registered');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      password: hashedPassword,
      role,
    });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
    signupOtpStore.delete(signupOtpKey);
  })
);

router.post(
  '/request-signup-otp',
  asyncHandler(async (req, res) => {
    const { email, phone, channel } = req.body;
    const selectedChannel = channel === 'phone' ? 'phone' : 'email';
    const identifier = getSignupIdentifier(email, phone, selectedChannel);

    if (!identifier) {
      res.status(400);
      throw new Error(selectedChannel === 'phone' ? 'Enter phone number first' : 'Enter email first');
    }

    const existingUser = await User.findOne(
      selectedChannel === 'phone' ? { phone: identifier } : { email: identifier }
    );
    if (existingUser) {
      res.status(400);
      throw new Error(selectedChannel === 'phone' ? 'Phone number already registered' : 'Email already registered');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await sendOtpByChannel({ channel: selectedChannel, destination: identifier, otp });

    const key = `${selectedChannel}:${identifier}`;
    signupOtpStore.set(key, { otp, verified: false, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      message: `Signup OTP sent by ${selectedChannel}`,
      channel: selectedChannel,
      destination: identifier,
      ...(isDemoOtpMode() ? { demoOtp: otp } : {}),
    });
  })
);

router.post(
  '/verify-signup-otp',
  asyncHandler(async (req, res) => {
    const { email, phone, channel, otp } = req.body;
    const selectedChannel = channel === 'phone' ? 'phone' : 'email';
    const identifier = getSignupIdentifier(email, phone, selectedChannel);
    const key = `${selectedChannel}:${identifier}`;
    const record = signupOtpStore.get(key);

    if (!record || record.expiresAt < Date.now()) {
      signupOtpStore.delete(key);
      res.status(400);
      throw new Error('Signup OTP expired. Please request a new OTP');
    }

    if (record.otp !== String(otp || '').trim()) {
      res.status(401);
      throw new Error('Invalid signup OTP');
    }

    signupOtpStore.set(key, { ...record, verified: true });
    res.json({ message: 'Signup OTP verified', channel: selectedChannel, destination: identifier });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, phone, identifier, password } = req.body;
    const user = await findUserByIdentifier(identifier || email || phone);
    if (user && (await bcrypt.compare(password, user.password))) {
      sendAuthResponse(res, user);
    } else {
      res.status(401);
      throw new Error('Invalid email, phone, or password');
    }
  })
);

router.post(
  '/request-otp',
  asyncHandler(async (req, res) => {
    const { identifier, channel } = req.body;
    const selectedChannel = channel === 'phone' ? 'phone' : 'email';
    const user = await findUserByIdentifier(identifier);

    if (!user) {
      res.status(404);
      throw new Error('No account found for that email or phone number');
    }

    if (selectedChannel === 'phone' && !user.phone) {
      res.status(400);
      throw new Error('This account does not have a phone number');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const destination = selectedChannel === 'phone' ? user.phone : user.email;
    await sendOtpByChannel({ channel: selectedChannel, destination, otp });

    const key = `${user._id}:${selectedChannel}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      message: `OTP sent by ${selectedChannel}`,
      channel: selectedChannel,
      destination,
      ...(isDemoOtpMode() ? { demoOtp: otp } : {}),
    });
  })
);

router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { identifier, channel, otp } = req.body;
    const selectedChannel = channel === 'phone' ? 'phone' : 'email';
    const user = await findUserByIdentifier(identifier);

    if (!user) {
      res.status(404);
      throw new Error('No account found for that email or phone number');
    }

    const key = `${user._id}:${selectedChannel}`;
    const record = otpStore.get(key);
    if (!record || record.expiresAt < Date.now()) {
      otpStore.delete(key);
      res.status(400);
      throw new Error('OTP expired. Please request a new OTP');
    }

    if (record.otp !== String(otp || '').trim()) {
      res.status(401);
      throw new Error('Invalid OTP');
    }

    otpStore.delete(key);
    sendAuthResponse(res, user);
  })
);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json(user);
  })
);

export default router;
