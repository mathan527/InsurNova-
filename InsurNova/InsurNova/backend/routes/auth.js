const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Policy = require('../models/Policy');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

// Supabase client (server-side: uses service_role key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://gtniwhmwrevmfgzuqdnr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper: detect MongoDB connectivity errors
const isMongoOffline = (err) =>
  err?.name === 'MongooseServerSelectionError' ||
  err?.code === 'ECONNREFUSED' ||
  (err?.message || '').includes('ECONNREFUSED') ||
  (err?.message || '').includes('buffering timed out');

// ─── HARDCODED DEMO USERS (work even without MongoDB) ──────────────────────
// Passwords pre-hashed: demo123 and admin123
const DEMO_USERS = [
  {
    _id: 'demo-user-001',
    id:  'demo-user-001',
    name: 'Ravi Kumar',
    email: 'demo@insurnova.com',
    passwordPlain: 'demo123',
    platform: 'Zomato',
    trust_score: 82,
    role: 'user',
  },
  {
    _id: 'admin-user-001',
    id:  'admin-user-001',
    name: 'InsurNova Admin',
    email: 'admin@insurnova.com',
    passwordPlain: 'admin123',
    platform: 'Other',
    trust_score: 95,
    role: 'admin',
  },
  {
    _id: 'demo-user-002',
    id:  'demo-user-002',
    name: 'Priya Sharma',
    email: 'test@insurnova.com',
    passwordPlain: 'test123',
    platform: 'Swiggy',
    trust_score: 74,
    role: 'user',
  },
];

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('platform').optional().isIn(['Swiggy', 'Zomato', 'Uber', 'Ola', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, platform, phone } = req.body;

    // ── Path A: MongoDB available ──────────────────────────────────────────
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = new User({
        name,
        email,
        password,
        phone: phone || '',
        platform: platform || 'Other',
        trust_score: 75
      });
      await user.save();

      // Create a default (inactive) policy
      const defaultPolicy = new Policy({
        user: user._id,
        premium: 500,
        coverage: 50000,
        status: 'inactive',
        covered_events: ['rain', 'heat', 'pollution', 'curfew']
      });
      await defaultPolicy.save();
      user.active_policy = defaultPolicy._id;
      await user.save();

      const token = generateToken(user);
      console.log(`[Auth] User registered via MongoDB: ${email}`);
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        token,
        user: { id: user._id, name: user.name, email: user.email, platform: user.platform, trust_score: user.trust_score, role: user.role }
      });

    } catch (mongoErr) {
      if (!isMongoOffline(mongoErr)) throw mongoErr; // rethrow non-connectivity errors
      console.warn('[Auth] MongoDB offline — falling back to Supabase Auth for signup');
    }

    // ── Path B: MongoDB offline → Supabase Auth fallback ──────────────────
    const { data: sbData, error: sbError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,           // skip email confirmation for demo
      user_metadata: { name, phone: phone || '', platform: platform || 'Other', trust_score: 75 }
    });

    if (sbError) {
      // If user already exists in Supabase
      if (sbError.message?.toLowerCase().includes('already registered')) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }
      console.error('[Auth] Supabase signup error:', sbError.message);
      return res.status(500).json({ success: false, message: 'Signup failed: ' + sbError.message });
    }

    const supabaseUserId = sbData.user.id;
    const token = generateToken({
      id: supabaseUserId,
      name,
      email,
      platform: platform || 'Other',
      trust_score: 75,
      role: 'user',
    });
    console.log(`[Auth] User registered via Supabase Auth: ${email} (${supabaseUserId})`);

    return res.status(201).json({
      success: true,
      message: 'User created successfully (via Supabase)',
      token,
      user: {
        id:          supabaseUserId,
        name,
        email,
        platform:    platform || 'Other',
        trust_score: 75,
        role:        'user'
      }
    });

  } catch (error) {
    console.error('[Auth] Signup error:', error.message);
    res.status(500).json({ success: false, message: 'Error creating user: ' + error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // ── 1. Check hardcoded demo users FIRST (no DB needed) ──────────────────
    const demoUser = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (demoUser && password === demoUser.passwordPlain) {
      const token = generateToken(demoUser);
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id:          demoUser._id,
          name:        demoUser.name,
          email:       demoUser.email,
          platform:    demoUser.platform,
          trust_score: demoUser.trust_score,
          role:        demoUser.role,
        },
      });
    }

    // ── 2. Try MongoDB for real registered users ────────────────────────────
    let mongoUser = null;
    let mongoOnline = true;
    try {
      mongoUser = await User.findOne({ email }).select('+password');
    } catch (mongoErr) {
      mongoOnline = false;
      console.warn('[Auth] MongoDB offline for login — will try Supabase');
    }

    if (mongoOnline && mongoUser) {
      const isMatch = await mongoUser.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = generateToken(mongoUser);
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id:          mongoUser._id,
          name:        mongoUser.name,
          email:       mongoUser.email,
          platform:    mongoUser.platform,
          trust_score: mongoUser.trust_score,
          role:        mongoUser.role,
        },
      });
    }

    // ── 3. Supabase Auth fallback (MongoDB offline or user not in Mongo) ─────
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Auth] MongoDB unavailable or user not found — trying Supabase login');
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
      if (!sbError && sbData?.user) {
        const supaUser = sbData.user;
        const token = generateToken({
          id:          supaUser.id,
          name:        supaUser.user_metadata?.name || email.split('@')[0],
          email:       supaUser.email,
          platform:    supaUser.user_metadata?.platform || 'Other',
          trust_score: 75,
          role:        'user',
        });
        console.log(`[Auth] User authenticated via Supabase: ${email}`);
        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id:          supaUser.id,
            name:        supaUser.user_metadata?.name || email.split('@')[0],
            email:       supaUser.email,
            platform:    supaUser.user_metadata?.platform || 'Other',
            trust_score: 75,
            role:        'user',
          },
        });
      }
      // Supabase returned an auth error — wrong password
      if (sbError && sbError.message?.toLowerCase().includes('invalid')) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // ── 4. Nothing worked ───────────────────────────────────────────────────
    return res.status(401).json({ success: false, message: 'Invalid credentials or account not found' });

  } catch (error) {
    // Final safety net — try Supabase before giving up
    try {
      const { email, password } = req.body;

      // Demo user check
      const demoUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === (email || '').toLowerCase()
      );
      if (demoUser && password === demoUser.passwordPlain) {
        const token = generateToken(demoUser);
        return res.json({ success: true, message: 'Login successful', token,
          user: { id: demoUser._id, name: demoUser.name, email: demoUser.email,
                  platform: demoUser.platform, trust_score: demoUser.trust_score, role: demoUser.role } });
      }

      // Supabase fallback
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
        if (!sbError && sbData?.user) {
          const supaUser = sbData.user;
          const token = generateToken({
            id: supaUser.id,
            name: supaUser.user_metadata?.name || email.split('@')[0],
            email: supaUser.email,
            platform: supaUser.user_metadata?.platform || 'Other',
            trust_score: 75,
            role: 'user',
          });
          return res.json({
            success: true, message: 'Login successful', token,
            user: { id: supaUser.id, name: supaUser.user_metadata?.name || email.split('@')[0],
                    email: supaUser.email, platform: supaUser.user_metadata?.platform || 'Other',
                    trust_score: 75, role: 'user' }
          });
        }
      }
    } catch (_) {}

    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});


/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      platform: req.user.platform,
      trust_score: req.user.trust_score,
      role: req.user.role
    }
  });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change current user's password
 * @access  Private
 */
router.post('/change-password', require('../middleware/auth').protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
    });
  }
});

module.exports = router;
