const User = require("../models/user");
const bcrypt = require('bcrypt');
const config = require('../config/config');
const logger = require('../utils/logger');

let users = {
    nama: config.admin.username,
    username: config.admin.username,
    password: config.admin.password,
    role: 'admin',
    email: config.admin.email
};

const seedAdminUser = async () => {
    try {
        const existingUser = await User.findOne({ where: { username: users.username } });

        if (existingUser) {
            logger.info('Admin user already exists');
            return;
        }

        const salt = bcrypt.genSaltSync(10);
        users.password = bcrypt.hashSync(users.password, salt);

        await User.create(users);

        logger.info('Admin user seeded successfully');
    } catch (error) {
        logger.error('Error seeding admin user:', error);
    }
};

module.exports = seedAdminUser;