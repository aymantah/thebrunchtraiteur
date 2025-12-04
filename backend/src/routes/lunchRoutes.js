import express from 'express';
import {
  getLunchMenu,
  getAdminLunchMenu,
  updateLunchMenu,
  createLunchMenuItem,
  addLunchProduct,
  updateLunchProduct,
  deleteLunchProduct,
  addLunchCategory,
  updateLunchCategory,
  deleteLunchCategory
} from '../controllers/lunchController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getLunchMenu);

// Protected admin routes - IMPORTANT: définir les routes spécifiques AVANT d'utiliser router.use()
// Gestion des catégories
router.post('/admin/category', authMiddleware, addLunchCategory);
router.put('/admin/category/:categoryId', authMiddleware, updateLunchCategory);
router.delete('/admin/category/:categoryId', authMiddleware, deleteLunchCategory);

// Gestion des produits
router.post('/admin/category/:categoryId/product', authMiddleware, addLunchProduct);
router.put('/admin/category/:categoryId/product/:productId', authMiddleware, updateLunchProduct);
router.delete('/admin/category/:categoryId/product/:productId', authMiddleware, deleteLunchProduct);

// Routes générales admin
router.get('/admin', authMiddleware, getAdminLunchMenu);
router.post('/admin', authMiddleware, createLunchMenuItem);
router.put('/admin', authMiddleware, updateLunchMenu);

export default router;
