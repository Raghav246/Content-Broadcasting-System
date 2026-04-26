const AuthService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../utils/validate');

const register = async (req, res) => {
  const error = validateRegister(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json({ user });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

const login = async (req, res) => {
  const error = validateLogin(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const data = await AuthService.login(req.body);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { register, login };
