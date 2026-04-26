const validateRegister = ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) return 'All fields are required';
  if (!['principal', 'teacher'].includes(role)) return 'Role must be principal or teacher';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

const validateLogin = ({ email, password }) => {
  if (!email || !password) return 'Email and password required';
  return null;
};

const validateUpload = ({ title, subject }) => {
  if (!title || !subject) return 'Title and subject are required';
  return null;
};

const validateReject = ({ rejection_reason }) => {
  if (!rejection_reason || !rejection_reason.trim()) return 'Rejection reason is required';
  return null;
};

module.exports = { validateRegister, validateLogin, validateUpload, validateReject };
