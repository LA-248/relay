import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { pool } from '../db/index.ts';
import { authenticateUser } from '../services/auth.service.ts';

export default function configurePassport() {
  passport.use(new LocalStrategy(authenticateUser));

  // Store user data in the session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.serializeUser(function (user: any, cb) {
    cb(null, user.id);
  });

  // Retrieves the user data from the session and makes it available in the request object
  passport.deserializeUser(function (id, cb) {
    pool.query(
      'SELECT id, username, profile_picture FROM users WHERE id = $1',
      [id],
      (err, result) => {
        cb(err, result.rows[0]);
      },
    );
  });
}
