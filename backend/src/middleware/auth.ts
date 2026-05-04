import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from '../utils/prisma';
import config from '../config';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

passport.use(
  new JwtStrategy(opts, async (payload: { userId: string }, done: Function) => {
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
export const authenticate = passport.authenticate('jwt', { session: false });

export { passport };
