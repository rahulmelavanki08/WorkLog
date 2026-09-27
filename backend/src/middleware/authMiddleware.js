const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'worklog_super_secure_jwt_secret_2026_india_worker_first';

/**
 * Authenticate JWT token from Authorization header
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired session token' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          workerProfile: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      req.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        workerProfile: user.workerProfile,
      };

      next();
    });
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    res.status(500).json({ error: 'Internal server error in authentication' });
  }
}

/**
 * Enforce one or more roles
 * @param  {...string} allowedRoles - e.g. 'WORKER', 'CONTRACTOR', 'ADMIN'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        error: `Unauthorized: Action requires [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
