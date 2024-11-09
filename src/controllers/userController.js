const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../service/emailService');
const paginate = require('../utils/pagination');
const { Op } = require('sequelize');
require('dotenv').config();
const secretKey = process.env.SECRETKEY;

class UserController {
  /**
   * Validates the format of an email address.
   * @param {string} email - The email address to validate.
   * @returns {boolean} - Returns true if the email format is valid.
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  createUser = async (req, res) => {
    try {
      const { nama, instansi, email, username, password } = req.body;
      const requiredFields = ['nama', 'instansi', 'email', 'username', 'password'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 400,
          message: `Data belum lengkap, field yang kurang: ${missingFields.join(', ')}`,
          data: null,
        });
      }

      if (!this.isValidEmail(email)) {
        return res.status(400).json({
          status: 400,
          message: 'Format email salah',
          data: null,
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          status: 400,
          message: 'Email sudah terdaftar',
          data: null,
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const userCreated = await User.create({
        nama,
        instansi,
        email,
        username,
        password: hashedPassword,
      });

      return res.status(201).json({
        status: 201,
        message: 'Register User Berhasil. Please verify your email to activate your account.',
        data: { user_id: userCreated.user_id },
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  sendVerificationEmail = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          status: 400,
          message: 'Email is required',
          data: null,
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: 'User not found',
          data: null,
        });
      }

      const verificationToken = jwt.sign({ id: user.user_id }, secretKey, { expiresIn: '10m' });
      const verificationLink = `${process.env.DOMAIN}/user/verify-email?token=${verificationToken}`;

      await emailService.sendVerificationEmail(user, verificationLink);

      res.status(200).json({
        status: 200,
        message: 'Verification email sent. Please check your email to verify your account.',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error sending verification email.',
        data: null,
      });
    }
  };

  verifyEmail = async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) {
        return res.status(400).json({
          status: 400,
          message: 'Token is missing',
          data: null,
        });
      }

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: 'Invalid or expired token',
            data: null,
          });
        }

        const userId = decoded.id;
        const user = await User.findByPk(userId);

        if (!user) {
          return res.status(404).json({
            status: 404,
            message: 'User not found',
            data: null,
          });
        }

        user.isEmailVerified = true;
        await user.save();

        res.status(200).json({
          status: 200,
          message: 'Email has been verified successfully',
          data: null,
        });
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const foundUser = await User.findOne({ where: { email } });
      if (!foundUser || !foundUser.password || !bcrypt.compareSync(password, foundUser.password)) {
        return res.status(400).json({
          status: 400,
          message: 'Email atau Password salah',
          data: null,
        });
      }

      const token = jwt.sign(
        { id: foundUser.user_id, email: foundUser.email, role: foundUser.role },
        secretKey,
        { expiresIn: '1d' }
      );

      res.status(200).json({
        status: 200,
        message: 'Berhasil login',
        token,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  getUsers = async (req, res) => {
    try {
      const {
        nama,
        role,
        email,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 'DESC',
      } = req.query;

      const where = {};

      if (nama) {
        where.nama = { [Op.iLike]: `%${nama}%` };
      }
      if (role) {
        where.role = role;
      }
      if (email) {
        where.email = { [Op.iLike]: `%${email}%` };
      }

      const options = {
        where,
        attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'createdAt'],
        order: [[sortBy, order.toUpperCase()]],
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      const result = await paginate(User, options);

      return res.status(200).json({
        status: 200,
        message: 'Users retrieved successfully.',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  /**
   * Get user by ID.
   * - Users can access their own data.
   * - Admins can access any user's data.
   */
  getUserById = async (req, res) => {
    try {
      const { userId } = req.params;
      const authenticatedUser = req.user;

      // Authorization check
      if (authenticatedUser.role !== 'admin' && authenticatedUser.user_id !== userId) {
        return res.status(403).json({
          status: 403,
          message: 'Access denied: insufficient privileges.',
          data: null,
        });
      }

      const user = await User.findByPk(userId, {
        attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role'],
      });

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: 'User not found.',
          data: null,
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'User retrieved successfully.',
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  /**
   * Updates user data.
   * - Users can update their own data.
   * - Admins can update any user's data.
   */
  updateUser = async (req, res) => {
    try {
      const { userId } = req.params;
      const { user } = req; // Authenticated user
      const updateData = req.body;

      // Allowed fields to update
      const allowedFields = ['nama', 'instansi', 'email', 'username'];
      const fieldsToUpdate = {};

      for (const field of allowedFields) {
        if (updateData[field]) {
          fieldsToUpdate[field] = updateData[field];
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({
          status: 400,
          message: 'No valid fields to update.',
          data: null,
        });
      }

      // Find the user to update
      const userToUpdate = await User.findByPk(userId);

      if (!userToUpdate) {
        return res.status(404).json({
          status: 404,
          message: 'User not found.',
          data: null,
        });
      }

      // Authorization check
      if (user.role !== 'admin' && user.user_id !== userId) {
        return res.status(403).json({
          status: 403,
          message: 'Access denied: insufficient privileges.',
          data: null,
        });
      }

      // Check for unique email
      if (fieldsToUpdate.email && fieldsToUpdate.email !== userToUpdate.email) {
        const existingEmail = await User.findOne({ where: { email: fieldsToUpdate.email } });
        if (existingEmail) {
          return res.status(400).json({
            status: 400,
            message: 'Email already in use.',
            data: null,
          });
        }
      }

      // Check for unique username
      if (fieldsToUpdate.username && fieldsToUpdate.username !== userToUpdate.username) {
        const existingUsername = await User.findOne({ where: { username: fieldsToUpdate.username } });
        if (existingUsername) {
          return res.status(400).json({
            status: 400,
            message: 'Username already in use.',
            data: null,
          });
        }
      }

      // Update user
      await userToUpdate.update(fieldsToUpdate);

      return res.status(200).json({
        status: 200,
        message: 'User updated successfully.',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  /**
   * Deletes a user.
   * - Users can delete their own account.
   * - Admins can delete any user's account.
   */
  deleteUser = async (req, res) => {
    try {
      const { userId } = req.params;
      const { user } = req; // Authenticated user

      // Find the user to delete
      const userToDelete = await User.findByPk(userId);

      if (!userToDelete) {
        return res.status(404).json({
          status: 404,
          message: 'User not found.',
          data: null,
        });
      }

      // Authorization check
      if (user.role !== 'admin' && user.user_id !== userId) {
        return res.status(403).json({
          status: 403,
          message: 'Access denied: insufficient privileges.',
          data: null,
        });
      }

      // Prevent deletion of admin users by non-admins
      if (userToDelete.role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          status: 403,
          message: 'Access denied: cannot delete an admin user.',
          data: null,
        });
      }

      // Delete user
      await userToDelete.destroy();

      return res.status(200).json({
        status: 200,
        message: 'User deleted successfully.',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  /**
   * Approve user role (e.g., promote from 'guest' to 'patroli').
   * Only admins can perform this action.
   */
  verifyUserRole = async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: 'User not found',
          data: null,
        });
      }

      if (user.role !== 'guest') {
        return res.status(400).json({
          status: 400,
          message: 'User is already approved',
          data: null,
        });
      }

      if (!user.isEmailVerified) {
        return res.status(400).json({
          status: 400,
          message: 'User email is not verified',
          data: null,
        });
      }

      user.role = 'patroli';
      await user.save();

      res.status(200).json({
        status: 200,
        message: 'User approved',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
        data: null,
      });
    }
  };

  oauthSuccess = async (req, res) => {
    const token = jwt.sign(
      { id: req.user.user_id, email: req.user.email, role: req.user.role },
      secretKey,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      status: 200,
      message: 'Berhasil login dengan OAuth',
      token,
    });
  };
}

module.exports = UserController;
