import pool from '../config/db.js';
import { errorResponse, successResponse } from '../utils/responseHelper.js';

export const getDashboardSummary = async (_req, res) => {
  try {
    const todayRevenue = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue
       FROM transactions
       WHERE created_at::date = CURRENT_DATE`,
    );

    const monthRevenue = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue
       FROM transactions
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
    );

    const todayTransactions = await pool.query(
      `SELECT COUNT(*) AS count
       FROM transactions
       WHERE created_at::date = CURRENT_DATE`,
    );

    const monthProfit = await pool.query(
      `SELECT COALESCE(SUM((ti.price - p.purchase_price) * ti.quantity), 0) AS profit
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       JOIN transactions t ON ti.transaction_id = t.id
       WHERE DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
    );

    const topProducts = await pool.query(
      `SELECT p.id, p.name, p.unit, SUM(ti.quantity) AS total_sold
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       JOIN transactions t ON ti.transaction_id = t.id
       WHERE DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY p.id, p.name, p.unit
       ORDER BY total_sold DESC
       LIMIT 5`,
    );

    const lowStockProducts = await pool.query(
      `SELECT id, name, stock, unit
       FROM products
       WHERE stock <= 5
       ORDER BY stock ASC
       LIMIT 10`,
    );

    return successResponse(res, 'Dashboard summary berhasil diambil', {
      today_revenue: parseFloat(todayRevenue.rows[0].revenue),
      month_revenue: parseFloat(monthRevenue.rows[0].revenue),
      today_transactions: parseInt(todayTransactions.rows[0].count),
      month_profit_estimate: parseFloat(monthProfit.rows[0].profit),
      top_products: topProducts.rows,
      low_stock_products: lowStockProducts.rows,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
