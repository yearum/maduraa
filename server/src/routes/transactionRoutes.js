import express from 'express';
import {
  createTransaction,
  getTransactionById,
  getTransactions,
} from '../controllers/transactionController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateIdParam } from '../middlewares/validateRequest.js';

const router = express.Router();

router.post('/', verifyToken, createTransaction);
router.get('/', verifyToken, getTransactions);
router.get('/:id', verifyToken, validateIdParam, getTransactionById);

export default router;
