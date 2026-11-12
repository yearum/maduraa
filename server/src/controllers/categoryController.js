import pool from '../config/db.js';
import { errorResponse, successResponse } from '../utils/responseHelper.js';

export const getCategories = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return successResponse(res, 'Daftar kategori berhasil diambil', result.rows);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [
      name,
    ]);
    if (existing.rows.length > 0) {
      return errorResponse(res, 'Kategori dengan nama tersebut sudah ada', 409);
    }

    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [
      name,
    ]);
    return successResponse(res, 'Kategori berhasil ditambahkan', result.rows[0], 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (category.rows.length === 0) {
      return errorResponse(res, 'Kategori tidak ditemukan', 404);
    }

    const existing = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name, id],
    );
    if (existing.rows.length > 0) {
      return errorResponse(res, 'Kategori dengan nama tersebut sudah ada', 409);
    }

    const result = await pool.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [
      name,
      id,
    ]);
    return successResponse(res, 'Kategori berhasil diupdate', result.rows[0]);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return errorResponse(res, 'Kategori tidak ditemukan', 404);
    }

    return successResponse(res, 'Kategori berhasil dihapus');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
