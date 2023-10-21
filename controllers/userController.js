const User = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

require('dotenv').config()
const secretKey = process.env.SECRETKEY

const createUser = async (req, res) => {
  try {
    const { nama, instansi, email, username, password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    const userCreated = await User.create({
      nama: nama,
      instansi: instansi,
      email: email,
      username: username,
      password: hashedPassword,
    });

    res.status(200).json({ msg: "Register User Berhasil", userCreated });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const foundUser = await User.findOne({
      where: {
        email: email
      }
    })
    if (!foundUser) return res.status(404).json({ msg: "User tidak ditemukan" })

    const match = bcrypt.compareSync(password, foundUser.password)
    if (!match) return res.status(404).json({ msg: "Password salah" })

    const token = jwt.sign({ email, user_id: foundUser.user_id, nama: foundUser.nama }, secretKey)

    res.status(200).json({ msg: "Berhasil login", token });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createUser,
  login,
};
