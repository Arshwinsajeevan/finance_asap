const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const prisma = require('../utils/prisma');
const config = require('../config');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          vertical: true,
          active: true,
        },
      });

      if (!user || !user.active) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

/**
 * Middleware: Authenticate JWT token
 */
const authenticate = passport.authenticate('jwt', { session: false });

module.exports = { passport, authenticate };
