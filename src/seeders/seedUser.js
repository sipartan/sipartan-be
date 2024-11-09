const User = require("../model/user");
const bcrypt = require('bcrypt');
require('dotenv').config();

let users = {
    nama: process.env.ADMIN_USERNAME,
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    email: process.env.ADMIN_EMAIL
};

const seedAdminUser = async () => {
    try {
        const existingUser = await User.findOne({ where: { username: users.username } });
        
        if (existingUser) {
            console.log('Admin user already exists');
            return;
        }

        const salt = bcrypt.genSaltSync(10);
        users.password = bcrypt.hashSync(users.password, salt);
        
        await User.create(users);
        
        console.log('Admin user seeded successfully');
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

module.exports = seedAdminUser;
