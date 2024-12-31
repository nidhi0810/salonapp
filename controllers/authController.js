// controllers/authController.js
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const googleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
passport.use(
  new googleStrategy(
    {
      clientID: '537627452553-9qgit51vfe4reutg5cgjck39fudtk8d2.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });

        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Login route
exports.googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// Callback route
exports.googleCallback = (req, res) => {
  passport.authenticate('google', async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Google login failed' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, 'your-jwt-secret', {
      expiresIn: '1d',
    });

    res.status(200).json({ token, user });
  })(req, res);
};

