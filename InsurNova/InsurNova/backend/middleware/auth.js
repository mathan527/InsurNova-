const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── In-memory demo user registry (mirrors DEMO_USERS in auth.js) ───────────
const DEMO_USERS_MAP = {
  'demo-user-001':  { _id: 'demo-user-001',  id: 'demo-user-001',  name: 'Ravi Kumar',      email: 'demo@insurnova.com',  platform: 'Zomato', trust_score: 82, role: 'user' },
  'admin-user-001': { _id: 'admin-user-001', id: 'admin-user-001', name: 'InsurNova Admin', email: 'admin@insurnova.com', platform: 'Other',  trust_score: 95, role: 'admin' },
  'demo-user-002':  { _id: 'demo-user-002',  id: 'demo-user-002',  name: 'Priya Sharma',   email: 'test@insurnova.com',  platform: 'Swiggy', trust_score: 74, role: 'user' },
};

/**
 * Protect routes — require a valid JWT token.
 * Handles demo users without hitting MongoDB (avoids CastError on non-ObjectId IDs).
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired, please log in again' : 'Invalid token';
      return res.status(401).json({ success: false, message: msg });
    }

    // ── 1. Short-circuit for hardcoded demo users — no DB lookup needed ────────
    if (DEMO_USERS_MAP[decoded.id]) {
      req.user = DEMO_USERS_MAP[decoded.id];
      return next();
    }

    // ── 2. Real MongoDB user lookup (with offline fallback) ─────────────────────
    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        // MongoDB reachable but no record — use JWT claims as fallback user object
        // (covers Supabase-only registrations not yet synced to Mongo)
        req.user = {
          _id:        decoded.id,
          id:         decoded.id,
          name:       decoded.name  || decoded.email?.split('@')[0] || 'User',
          email:      decoded.email || '',
          platform:   decoded.platform || 'Other',
          trust_score: decoded.trust_score || 70,
          role:       decoded.role  || 'user',
        };
        return next();
      }
      req.user = user;
      next();
    } catch (dbErr) {
      // MongoDB offline — reconstruct safe user object from the already-verified JWT
      const isOffline = dbErr.message && (
        dbErr.message.includes('ECONNREFUSED') ||
        dbErr.message.includes('buffering timed out') ||
        dbErr.message.includes('connect ETIMEDOUT') ||
        dbErr.message.includes('MongoNetworkError') ||
        dbErr.message.includes('topology was destroyed') ||
        dbErr.name === 'MongoNetworkError'
      );

      // CastError = Supabase UUID passed where MongoDB ObjectId expected — treat as fallback
      const isCastError = dbErr.name === 'CastError' || dbErr.message?.includes('Cast to ObjectId failed');

      if (isOffline || isCastError) {
        if (isCastError) console.warn('[Auth] Supabase UUID not a Mongo ObjectId — using JWT claims');
        else console.warn('[Auth] MongoDB offline — using JWT claims as user identity');
        req.user = {
          _id:        decoded.id,
          id:         decoded.id,
          name:       decoded.name  || decoded.email?.split('@')[0] || 'User',
          email:      decoded.email || '',
          platform:   decoded.platform || 'Other',
          trust_score: decoded.trust_score || 70,
          role:       decoded.role  || 'user',
          _fromJWT:   true,   // flag so downstream routes can skip DB writes
        };
        return next();
      }

      console.error('[Auth] DB lookup failed (non-network error):', dbErr.message);
      return res.status(503).json({ success: false, message: 'Database unavailable' });

    }

  } catch (error) {
    console.error('[Auth] Unexpected error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error in authentication' });
  }
};

/**
 * Admin only middleware
 */
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

/**
 * Generate JWT token.
 * Accepts either a plain id string or a user object.
 * Embeds name/email/platform/role so the offline protect() fallback
 * can reconstruct req.user without a MongoDB round-trip.
 */
exports.generateToken = (userOrId) => {
  const payload = typeof userOrId === 'object' && userOrId !== null
    ? {
        id:          String(userOrId._id || userOrId.id),
        email:       userOrId.email       || '',
        name:        userOrId.name        || '',
        platform:    userOrId.platform    || 'Other',
        trust_score: userOrId.trust_score || 70,
        role:        userOrId.role        || 'user',
      }
    : { id: String(userOrId) };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
