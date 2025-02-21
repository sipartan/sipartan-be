const Joi = require('joi');

require('dotenv').config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(3000),
    BASE_URL: Joi.string().uri().required(),
    ADMIN_USERNAME: Joi.string().required(),
    ADMIN_PASSWORD: Joi.string().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    SECRETKEY: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASS: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_SCHEMA: Joi.string().required(),
    FRONTEND_URL: Joi.string().uri().required(),
    BCRYPT_SALT_ROUNDS: Joi.number().required(),
    AUTH_TOKEN_EXPIRATION: Joi.string().required(),
    RESET_PASSWORD_TOKEN_EXPIRATION: Joi.string().required(),
    VERIFY_EMAIL_TOKEN_EXPIRATION: Joi.string().required(),
    EMAIL_USER: Joi.string().email().required(),
    EMAIL_PASS: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    FACEBOOK_APP_ID: Joi.string().required(),
    FACEBOOK_APP_SECRET: Joi.string().required(),
    OPENWEATHER_API_KEY: Joi.string().required(),
    GEOCODING_API_KEY: Joi.string().required(),
    GOOGLE_MAPS_API_KEY: Joi.string().required(),
    MINIO_ENDPOINT: Joi.string().uri().required(),
    MINIO_ROOT_USER: Joi.string().required(),
    MINIO_ROOT_PASSWORD: Joi.string().required(),
    MINIO_BUCKET: Joi.string().required(),
}).unknown().required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: {
        nodeEnv: envVars.NODE_ENV,
        port: envVars.PORT,
        baseUrl: envVars.BASE_URL,
    },
    seedAccount: {
        admin: {
            username: envVars.ADMIN_USERNAME,
            password: envVars.ADMIN_PASSWORD,
            email: envVars.ADMIN_EMAIL,
        },
        penilai: {
            username: envVars.PENILAI_USERNAME,
            password: envVars.PENILAI_PASSWORD,
            email: envVars.PENILAI_EMAIL,
        },
        guest: {
            username: envVars.GUEST_USERNAME,
            password: envVars.GUEST_PASSWORD,
            email: envVars.GUEST_EMAIL,
        }
    },
    jwt: {
        secretKey: envVars.SECRETKEY,
        bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
        authTokenExpiration: envVars.AUTH_TOKEN_EXPIRATION,
        resetPasswordTokenExpiration: envVars.RESET_PASSWORD_TOKEN_EXPIRATION,
        verifyEmailTokenExpiration: envVars.VERIFY_EMAIL_TOKEN_EXPIRATION,
    },
    database: {
        host: envVars.DB_HOST,
        user: envVars.DB_USER,
        password: envVars.DB_PASS,
        name: envVars.DB_NAME,
        port: envVars.DB_PORT,
        schema: envVars.DB_SCHEMA,
    },
    minio: {
        endpoint: envVars.MINIO_ENDPOINT,
        rootUser: envVars.MINIO_ROOT_USER,
        rootPassword: envVars.MINIO_ROOT_PASSWORD,
        bucket: envVars.MINIO_BUCKET,
    },
    urls: {
        frontend: envVars.FRONTEND_URL,
    },
    email: {
        user: envVars.EMAIL_USER,
        password: envVars.EMAIL_PASS,
    },
    oauth: {
        google: {
            clientId: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        },
        facebook: {
            appId: envVars.FACEBOOK_APP_ID,
            appSecret: envVars.FACEBOOK_APP_SECRET,
        },
    },
    apiKeys: {
        openWeather: envVars.OPENWEATHER_API_KEY,
        geocoding: envVars.GEOCODING_API_KEY,
        googleMaps: envVars.GOOGLE_MAPS_API_KEY,
    },
};
