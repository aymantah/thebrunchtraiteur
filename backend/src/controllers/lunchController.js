import { validationResult } from 'express-validator';
import LunchMenu from '../models/LunchMenu.js';
import cloudinary from '../config/cloudinary.js';

// ========== GET LUNCH MENU (PUBLIC) ==========
export const getLunchMenu = async (req, res) => {
  try {
    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    // Filter active categories and products
    const filteredMenu = {
      ...lunchMenu.toObject(),
      categories: lunchMenu.categories
        .filter(cat => cat.isActive)
        .map(cat => ({
          ...cat,
          products: cat.products.filter(prod => prod.isActive)
        }))
    };

    res.json({
      success: true,
      data: filteredMenu
    });
  } catch (error) {
    console.error('Error fetching lunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== GET LUNCH MENU (ADMIN) ==========
export const getAdminLunchMenu = async (req, res) => {
  try {
    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    res.json({
      success: true,
      data: lunchMenu
    });
  } catch (error) {
    console.error('Error fetching admin lunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== CREATE LUNCH MENU ITEM ==========
export const createLunchMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      lunchMenu = new LunchMenu(req.body);
    } else {
      Object.assign(lunchMenu, req.body);
    }

    lunchMenu.lastUpdated = new Date();
    await lunchMenu.save();

    res.status(201).json({
      success: true,
      message: 'Lunch menu created/updated successfully',
      data: lunchMenu
    });
  } catch (error) {
    console.error('Error creating lunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== UPDATE LUNCH MENU ==========
export const updateLunchMenu = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    Object.assign(lunchMenu, req.body);
    lunchMenu.lastUpdated = new Date();
    await lunchMenu.save();

    res.json({
      success: true,
      message: 'Lunch menu updated successfully',
      data: lunchMenu
    });
  } catch (error) {
    console.error('Error updating lunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== GESTION DES CATÉGORIES ==========

export const addLunchCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id, name, icon, description, isActive, sortOrder } = req.body;

    // Récupérer le menu lunch (il n'y en a qu'un seul)
    let lunchMenu = await LunchMenu.findOne();
    
    // Si le menu n'existe pas, le créer
    if (!lunchMenu) {
      lunchMenu = new LunchMenu({
        categories: [],
        isActive: true,
        lastUpdated: new Date()
      });
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = lunchMenu.categories.find(cat => cat.id === id);
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category with this ID already exists' 
      });
    }

    // Créer la nouvelle catégorie
    const newCategory = {
      id,
      name,
      icon: icon || 'Utensils',
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      products: []
    };

    lunchMenu.categories.push(newCategory);
    lunchMenu.lastUpdated = new Date();
    
    await lunchMenu.save();

    res.status(201).json({
      success: true,
      message: 'Category added successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Error adding lunch category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

export const updateLunchCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, icon, description, isActive, sortOrder } = req.body;

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lunch menu not found' 
      });
    }

    const category = lunchMenu.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Mettre à jour les champs
    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder);

    lunchMenu.lastUpdated = new Date();
    await lunchMenu.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating lunch category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

export const deleteLunchCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lunch menu not found' 
      });
    }

    const categoryIndex = lunchMenu.categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Supprimer la catégorie
    lunchMenu.categories.splice(categoryIndex, 1);
    lunchMenu.lastUpdated = new Date();
    
    await lunchMenu.save();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lunch category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ========== GESTION DES PRODUITS ==========

export const addLunchProduct = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, price, quantity, isPremium, image, isActive, sortOrder } = req.body;

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    const category = lunchMenu.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const newProduct = {
      name,
      description,
      price,
      quantity: quantity || '',
      isPremium: isPremium || false,
      image: image || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0
    };

    category.products.push(newProduct);
    lunchMenu.lastUpdated = new Date();
    
    await lunchMenu.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error adding lunch product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateLunchProduct = async (req, res) => {
  try {
    const { categoryId, productId } = req.params;
    const updateData = req.body;

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    const category = lunchMenu.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const product = category.products.id(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Mettre à jour les champs
    Object.keys(updateData).forEach(key => {
      if (key === 'sortOrder') {
        product[key] = parseInt(updateData[key]);
      } else {
        product[key] = updateData[key];
      }
    });

    lunchMenu.lastUpdated = new Date();
    await lunchMenu.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating lunch product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteLunchProduct = async (req, res) => {
  try {
    const { categoryId, productId } = req.params;

    const lunchMenu = await LunchMenu.findOne();
    
    if (!lunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Lunch menu not found'
      });
    }

    const category = lunchMenu.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const product = category.products.id(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (product.image) {
      try {
        const publicId = product.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`thelunch/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    product.deleteOne();
    lunchMenu.lastUpdated = new Date();
    
    await lunchMenu.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lunch product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
