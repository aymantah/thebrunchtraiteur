import express from 'express';
import {
  getBrunchMenu,
  getAdminBrunchMenu,
  updateBrunchMenu,
  createBrunchMenuItem,
  addBrunchProduct,
  updateBrunchProduct,
  deleteBrunchProduct,
  addBrunchCategory,
  updateBrunchCategory,
  deleteBrunchCategory
} from '../controllers/brunchController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getBrunchMenu);

// Protected admin routes - IMPORTANT: définir les routes spécifiques AVANT router.use()
// Gestion des catégories
router.post('/admin/category', authMiddleware, addBrunchCategory);
router.put('/admin/category/:categoryId', authMiddleware, updateBrunchCategory);
router.delete('/admin/category/:categoryId', authMiddleware, deleteBrunchCategory);

// Gestion des produits
router.post('/admin/category/:categoryId/product', authMiddleware, addBrunchProduct);
router.put('/admin/category/:categoryId/product/:productId', authMiddleware, updateBrunchProduct);
router.delete('/admin/category/:categoryId/product/:productId', authMiddleware, deleteBrunchProduct);

// Routes générales admin
router.get('/admin', authMiddleware, getAdminBrunchMenu);
router.post('/admin', authMiddleware, createBrunchMenuItem);
router.put('/admin', authMiddleware, updateBrunchMenu);

export default router;
