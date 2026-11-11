import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama, email, dan password wajib diisi!',
      });
    }

    const existingUser = await pool.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar!',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO profiles (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'user'],
    );

    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil! Silakan login.',
      data: newUser.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi!',
      });
    }

    const userQuery = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
      expiresIn: '24h',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMe = (req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Profil pengguna berhasil diambil',
    user: req.user,
  });
