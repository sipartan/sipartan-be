const Joi = require('joi');

const getAllUsers = {
    query: Joi.object().keys({
        page: Joi.number().min(1),
        limit: Joi.number().min(1),
        sortBy: Joi.string(),
        order: Joi.string().valid('ASC', 'DESC'),
        nama: Joi.string(),
        role: Joi.string().valid('guest', 'penilai', 'admin'),
        email: Joi.string().email(),
    }).unknown(false),
};

const getUser = {
    params: Joi.object().keys({
        user_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const updateUser = {
    params: Joi.object().keys({
        user_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
    body: Joi.object().keys({
        nama: Joi.string(),
        instansi: Joi.string(),
        email: Joi.string().email(),
        username: Joi.string()
    }).unknown(false),
};

const deleteUser = {
    params: Joi.object().keys({
        user_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
};

const verifyUserRole = {
    params: Joi.object().keys({
        user_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
    }).unknown(false),
    body: Joi.object().keys({
        role: Joi.string().required().valid('guest', 'penilai'),
    }).unknown(false),
};

module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    verifyUserRole,
};