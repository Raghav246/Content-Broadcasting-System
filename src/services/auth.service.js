const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const register = async ({ name, email, password, role }) => {
  const exists = await UserModel.findByEmail(email);
  if (exists.rows.length) throw { status: 409, message: 'Email already registered' };

  const password_hash = await bcrypt.hash(password, 10);
  const result = await UserModel.create(name, email, password_hash, role);
  return result.rows[0];
};

const login = async ({ email, password }) => {
  const result = await UserModel.findByEmail(email);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw { status: 401, message: 'Invalid credentials' };
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

module.exports = { register, login };
