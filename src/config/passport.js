const passport = require('passport');
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');
const config = require('../config/config');

const secretKey = config.jwt.secretKey;

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
            clientID: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            callbackURL: `${config.env.domain}/auth/google/callback`, // TODO: Change this in the future with the actual domain
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
            clientID: config.oauth.facebook.appId,
            clientSecret: config.oauth.facebook.appSecret,
            callbackURL: `${config.env.domain}/auth/facebook/callback`, // TODO: Change this in the future with the actual domain
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