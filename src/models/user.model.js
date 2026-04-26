const pool = require('../utils/db');

const findByEmail = (email) =>
  pool.query('SELECT * FROM users WHERE email = $1', [email]);

const findById = (id) =>
  pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);

const findTeacherById = (id) =>
  pool.query("SELECT id FROM users WHERE id = $1 AND role = 'teacher'", [id]);

const create = (name, email, password_hash, role) =>
  pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
    [name, email, password_hash, role]
  );

module.exports = { findByEmail, findById, findTeacherById, create };
