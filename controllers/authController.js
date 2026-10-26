const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_key_24aiml017';
const JWT_EXPIRES_IN = '1h';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin123';

/**
 * Generate a JWT token for a user document with 1 hour expiration, including role.
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Seed a default administrator account if one does not already exist.
 */
async function seedDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Administrator',
        email: 'admin@taskmanager.com',
        password: 'adminpassword123',
        role: 'admin'
      });
      console.log('Default administrator account created: admin@taskmanager.com (Password: adminpassword123)');
    }
  } catch (err) {
    console.error('Admin seeding notice:', err.message);
  }
}

/**
 * POST /register (or /signup)
 * Register a new user with email and password.
 * Safe role provisioning: only assigns 'admin' if valid adminCode is supplied.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, adminCode } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Please provide both email and password.'
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        error: 'Please provide a valid email address.'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        error: 'An account with this email already exists.'
      });
    }

    // Safe role assignment: Default to 'user'. Only set 'admin' if matching secret code is provided.
    let role = 'user';
    if (adminCode && String(adminCode).trim() === ADMIN_SECRET_KEY) {
      role = 'admin';
    } else if (adminCode && String(adminCode).trim() !== ADMIN_SECRET_KEY) {
      return res.status(400).json({
        error: 'Invalid admin invite code. Please leave blank to register as a regular user.'
      });
    }

    const userName = name && String(name).trim() ? String(name).trim() : normalizedEmail.split('@')[0];

    const newUser = await User.create({
      name: userName,
      email: normalizedEmail,
      password: String(password),
      role
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /login
 * Authenticate existing user with email and password using bcrypt.compare.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /me
 * Get current authenticated user's safe profile details including role.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  signup: register,
  login,
  getMe,
  seedDefaultAdmin
};
