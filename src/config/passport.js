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
            if (jwt_payload.tokenType !== 'auth') {
                return done(null, false, { message: 'Invalid token type' });
            }

            const user = await User.findByPk(jwt_payload.id,
                { attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'is_email_verified'] }
            );
            if (user) {
                return done(null, user);
            }
            return done(null, false, { message: 'Invalid token or user not found' });
        } catch (err) {
            return done(err, false);
        }
    })
);

// middleware to handle unauthorized requests
passport.authenticateJwt = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => { // session: false to prevent creating session because we are using JWT
        if (err || !user) {
            return res.status(401).json({
                status: 401,
                message: info?.message || 'Unauthorized access. Please provide a valid token.',
            });
        }
        req.user = user;
        next();
    })(req, res, next);
};

// google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            callbackURL: `${config.env.baseUrl}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const [user, created] = await User.findOrCreate({
                    where: { google_id: profile.id },
                    defaults: {
                        nama: profile.displayName,
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        google_id: profile.id,
                        is_email_verified: true,
                        role: 'guest',
                    },
                });

                const filteredUser = {
                    user_id: user.user_id,
                    nama: user.nama,
                    instansi: user.instansi,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    is_email_verified: user.is_email_verified,
                };

                return done(null, filteredUser);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);



// facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: config.oauth.facebook.appId,
            clientSecret: config.oauth.facebook.appSecret,
            callbackURL: `${config.env.baseUrl}/auth/facebook/callback`, // TODO: change this in the future with the actual baseUrl
            profileFields: ['id', 'displayName', 'emails'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const [user, created] = await User.findOrCreate({
                    where: { facebook_id: profile.id },
                    defaults: {
                        nama: profile.displayName,
                        username: profile.displayName,
                        email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
                        facebook_id: profile.id,
                        is_email_verified: true,
                        role: 'guest',
                    },
                });

                const filteredUser = {
                    user_id: user.user_id,
                    nama: user.nama,
                    instansi: user.instansi,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    is_email_verified: user.is_email_verified,
                };

                return done(null, filteredUser);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

module.exports = passport;
