const Joi = require('joi');
const { password } = require('./costumValidation');

const register = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required().custom(password),
        nama: Joi.string().required(),
        instansi: Joi.string().required(),
        username: Joi.string().required(),
    }).unknown(false),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }).unknown(false),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }).unknown(false),
};

const resetPassword = {
    body: Joi.object().keys({
        token: Joi.string().required(),
        password: Joi.string().required().custom(password),
    }).unknown(false),
};

const sendVerificationEmail = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }).unknown(false),
};

const verifyEmail = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }).unknown(false),
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
};