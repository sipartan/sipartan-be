const User = require("../models/user");
const bcrypt = require("bcrypt");
const config = require("../config/config");
const logger = require("../utils/logger");

const SALT_ROUNDS = parseInt(config.jwt.bcryptSaltRounds, 10);

const users = [
    {
        nama: config.seedAccount.admin.username,
        username: config.seedAccount.admin.username,
        password: config.seedAccount.admin.password,
        role: "admin",
        email: config.seedAccount.admin.email,
    },
    {
        nama: config.seedAccount.penilai.username,
        username: config.seedAccount.penilai.username,
        password: config.seedAccount.penilai.password,
        role: "penilai",
        email: config.seedAccount.penilai.email,
    },
    {
        nama: config.seedAccount.guest.username,
        username: config.seedAccount.guest.username,
        password: config.seedAccount.guest.password,
        role: "guest",
        email: config.seedAccount.guest.email,
    },
];

const seedUsers = async () => {
    try {
        // fetch all existing users in one query
        const existingUsers = await User.findAll({
            where: {
                username: users.map((u) => u.username),
                email: users.map((u) => u.email),
            },
            attributes: ["username", "email"],
        });

        const existingUsernames = new Set(existingUsers.map((u) => u.username));
        const existingEmails = new Set(existingUsers.map((u) => u.email));

        // filter out existing users and hash passwords in parallel
        const newUsers = users
            .filter((user) => !existingUsernames.has(user.username) && !existingEmails.has(user.email))
            .map(async (user) => {
                user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
                return user;
            });

        // wait for password hashing to complete
        const usersToCreate = await Promise.all(newUsers);

        // bulk insert new users
        if (usersToCreate.length > 0) {
            await User.bulkCreate(usersToCreate);
            usersToCreate.forEach((user) => logger.info(`${user.role} user seeded successfully`));
        } else {
            logger.info("No new users to seed.");
        }
    } catch (error) {
        logger.error("Error seeding users:", error);
    }
};

module.exports = seedUsers;
