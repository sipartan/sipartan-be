const passport = require('passport');
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');
require('dotenv').config();

const secretKey = process.env.SECRETKEY;

// JWT Strategy
const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretKey,
};

passport.use(
    new JwtStrategy(jwtOpts, async (jwt_payload, done) => {
        try {
            const user = await User.findByPk(jwt_payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    })
);

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.DOMAIN}/auth/google/callback`, // TODO: Change this in the future with the actual domain
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ where: { googleId: profile.id } });
                if (!user) {
                    user = await User.create({
                        nama: profile.displayName,
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        isEmailVerified: true,
                        role: 'guest',
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: `${process.env.DOMAIN}/auth/facebook/callback`, // TODO: Change this in the future with the actual domain
            profileFields: ['id', 'displayName', 'emails'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ where: { facebookId: profile.id } });
                if (!user) {
                    user = await User.create({
                        nama: profile.displayName,
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        facebookId: profile.id,
                        isEmailVerified: true,
                        role: 'guest',
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

module.exports = passport;
