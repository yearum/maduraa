import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateIdParam, validateRequired } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, validateIdParam, getProductById);
router.post('/', verifyToken, validateRequired(['name', 'selling_price']), createProduct);
router.put('/:id', verifyToken, validateIdParam, updateProduct);
router.delete('/:id', verifyToken, validateIdParam, deleteProduct);

export default router;
