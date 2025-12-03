import BrunchMenu from '../models/BrunchMenu.js';
import { body, validationResult } from 'express-validator';

// @desc    Get active brunch menu
// @route   GET /api/brunch
// @access  Public
export const getBrunchMenu = async (req, res) => {
  try {
    const brunchMenu = await BrunchMenu.getActiveMenu();
    
    if (!brunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'No active brunch menu found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        categories: brunchMenu.activeCategories,
        lastUpdated: brunchMenu.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching brunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching brunch menu'
    });
  }
};

// @desc    Get brunch menu for admin
// @route   GET /api/brunch/admin
// @access  Private (Admin)
export const getAdminBrunchMenu = async (req, res) => {
  try {
    const brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    
    if (!brunchMenu) {
      const defaultMenu = new BrunchMenu({
        categories: []
      });
      await defaultMenu.save();
      
      return res.status(200).json({
        success: true,
        data: defaultMenu
      });
    }

    res.status(200).json({
      success: true,
      data: brunchMenu
    });
  } catch (error) {
    console.error('Error fetching admin brunch menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin brunch menu'
    });
  }
};

// @desc    Update entire brunch menu or perform specific actions
// @route   PUT /api/brunch/admin
// @access  Private (Admin)
export const updateBrunchMenu = [
  async (req, res) => {
    try {
      const { action, categoryId, productId, categories } = req.body;
      
      let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
      
      if (!brunchMenu) {
        brunchMenu = new BrunchMenu();
      }

      // Handle specific actions
      if (action === 'deleteProduct' && categoryId && productId) {
        const category = brunchMenu.categories.find(cat => cat.id === categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }

        // Find and remove the product
        const productIndex = category.products.findIndex(product => 
          product._id.toString() === productId || product.id === productId
        );
        
        if (productIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        category.products.splice(productIndex, 1);
        brunchMenu.lastUpdated = new Date();
        
        await brunchMenu.save();
        
        return res.status(200).json({
          success: true,
          message: 'Product deleted successfully',
          data: brunchMenu
        });
      }

      // Handle product update
      if (action === 'updateProduct' && categoryId && req.body.itemId) {
        const category = brunchMenu.categories.find(cat => cat.id === categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }

        // Find the product to update
        const productIndex = category.products.findIndex(product => 
          product._id.toString() === req.body.itemId || product.id === req.body.itemId
        );
        
        if (productIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        // Update the product with new data
        const updates = req.body.updates;
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            category.products[productIndex][key] = updates[key];
          }
        });

        brunchMenu.lastUpdated = new Date();
        await brunchMenu.save();
        
        return res.status(200).json({
          success: true,
          message: 'Product updated successfully',
          data: brunchMenu
        });
      }

      // Handle product addition
      if (action === 'addProduct' && categoryId && req.body.productData) {
        const category = brunchMenu.categories.find(cat => cat.id === categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }

        // Create new product with generated ID
        const newProduct = {
          id: Date.now().toString(),
          name: req.body.productData.name || '',
          description: req.body.productData.description || '',
          price: req.body.productData.price || '',
          items: req.body.productData.items || [],
          lastItem: req.body.productData.lastItem || '',
          isActive: req.body.productData.isActive !== undefined ? req.body.productData.isActive : true
        };

        // Add product to category
        if (!category.products) {
          category.products = [];
        }
        category.products.push(newProduct);

        brunchMenu.lastUpdated = new Date();
        await brunchMenu.save();
        
        return res.status(200).json({
          success: true,
          message: 'Product added successfully',
          data: brunchMenu
        });
      }

      // Handle plateau update
      if (action === 'updatePlateau' && categoryId && req.body.itemId) {
        const category = brunchMenu.categories.find(cat => cat.id === categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }

        // Find the plateau to update
        const plateauIndex = category.plateaux?.findIndex(plateau => 
          plateau._id.toString() === req.body.itemId || plateau.id === req.body.itemId
        );
        
        if (plateauIndex === -1 || !category.plateaux) {
          return res.status(404).json({
            success: false,
            message: 'Plateau not found'
          });
        }

        // Update the plateau with new data
        const updates = req.body.updates;
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            category.plateaux[plateauIndex][key] = updates[key];
          }
        });

        brunchMenu.lastUpdated = new Date();
        await brunchMenu.save();
        
        return res.status(200).json({
          success: true,
          message: 'Plateau updated successfully',
          data: brunchMenu
        });
      }

      // Handle full menu update
      if (categories) {
        brunchMenu.categories = categories;
        brunchMenu.lastUpdated = new Date();
        
        await brunchMenu.save();
        
        return res.status(200).json({
          success: true,
          message: 'Brunch menu updated successfully',
          data: brunchMenu
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid request. Please provide action or categories.'
      });

    } catch (error) {
      console.error('Error updating brunch menu:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating brunch menu'
      });
    }
  }
];

// @desc    Add a new category to brunch menu
// @route   POST /api/brunch/admin/category
// @access  Private (Admin)
export const addBrunchCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Le nom de la catégorie est obligatoire." });
    }

    let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    if (!brunchMenu) {
      brunchMenu = new BrunchMenu({ categories: [] });
      await brunchMenu.save();
    }

    // Vérifier unicité du nom
    const exists = brunchMenu.categories.find(cat => cat.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (exists) {
      return res.status(400).json({ success: false, message: "Une catégorie avec ce nom existe déjà." });
    }

    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description ? description.trim() : "",
      products: [],
      isActive: true
    };

    brunchMenu.categories.push(newCategory);
    brunchMenu.lastUpdated = new Date();
    await brunchMenu.save();

    res.status(201).json({ success: true, category: newCategory, data: brunchMenu });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la catégorie:", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'ajout de la catégorie." });
  }
};

// @desc    Update a category in brunch menu
// @route   PUT /api/brunch/admin/category/:categoryId
// @access  Private (Admin)
export const updateBrunchCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, isActive } = req.body;

    let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    if (!brunchMenu) {
      return res.status(404).json({ success: false, message: "Menu brunch non trouvé." });
    }

    const category = brunchMenu.categories.find(cat => cat.id === categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Catégorie non trouvée." });
    }

    if (name && name.trim().length > 0) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = isActive;

    brunchMenu.lastUpdated = new Date();
    await brunchMenu.save();

    res.status(200).json({ success: true, category, data: brunchMenu });
  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie:", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la modification de la catégorie." });
  }
};

// @desc    Delete a category from brunch menu
// @route   DELETE /api/brunch/admin/category/:categoryId
// @access  Private (Admin)
export const deleteBrunchCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    if (!brunchMenu) {
      return res.status(404).json({ success: false, message: "Menu brunch non trouvé." });
    }

    const index = brunchMenu.categories.findIndex(cat => cat.id === categoryId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Catégorie non trouvée." });
    }

    brunchMenu.categories.splice(index, 1);
    brunchMenu.lastUpdated = new Date();
    await brunchMenu.save();

    res.status(200).json({ success: true, message: "Catégorie supprimée.", data: brunchMenu });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression de la catégorie." });
  }
};

// @desc    Add formula to brunch menu
// @route   POST /api/brunch/admin/category/:categoryId/product
// @access  Private (Admin)
export const addBrunchProduct = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { categoryId } = req.params;
      
      let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
      
      if (!brunchMenu) {
        return res.status(404).json({
          success: false,
          message: 'Brunch menu not found'
        });
      }
      
      const category = brunchMenu.categories.find(cat => cat.id === categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      category.products.push(req.body);
      brunchMenu.lastUpdated = new Date();
      
      await brunchMenu.save();
      
      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: brunchMenu
      });
    } catch (error) {
      console.error('Error adding brunch product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while adding product'
      });
    }
  }
];

// @desc    Update product in brunch menu
// @route   PUT /api/brunch/admin/category/:categoryId/product/:productId
// @access  Private (Admin)
export const updateBrunchProduct = [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { categoryId, productId } = req.params;
      
      let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
      
      if (!brunchMenu) {
        return res.status(404).json({
          success: false,
          message: 'Brunch menu not found'
        });
      }
      
      const category = brunchMenu.categories.find(cat => cat.id === categoryId);
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
      
      Object.assign(product, req.body);
      brunchMenu.lastUpdated = new Date();
      
      await brunchMenu.save();
      
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: brunchMenu
      });
    } catch (error) {
      console.error('Error updating brunch product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating product'
      });
    }
  }
];

// @desc    Delete product from brunch menu
// @route   DELETE /api/brunch/admin/category/:categoryId/product/:productId
// @access  Private (Admin)
export const deleteBrunchProduct = async (req, res) => {
  try {
    const { categoryId, productId } = req.params;
    
    let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    
    if (!brunchMenu) {
      return res.status(404).json({
        success: false,
        message: 'Brunch menu not found'
      });
    }
    
    const category = brunchMenu.categories.find(cat => cat.id === categoryId);
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
    
    product.remove();
    brunchMenu.lastUpdated = new Date();
    
    await brunchMenu.save();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: brunchMenu
    });
  } catch (error) {
    console.error('Error deleting brunch product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// @desc    Create new product for brunch menu
// @route   POST /api/brunch/admin
// @access  Private (Admin)
export const createBrunchMenuItem = async (req, res) => {
  try {
    const { action, categoryId, productData } = req.body;
    
    // Validation de base des données
    if (!action || !productData) {
      return res.status(400).json({
        success: false,
        message: 'Action et données du produit sont obligatoires'
      });
    }

    // Validation des champs obligatoires
    const requiredFields = ['name', 'description', 'price'];
    const missingFields = requiredFields.filter(field => 
      !productData[field] || 
      (typeof productData[field] === 'string' && productData[field].trim().length === 0)
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    // Validation et nettoyage du prix
    let cleanPrice = productData.price;
    if (typeof cleanPrice === 'string') {
      cleanPrice = cleanPrice.replace(/[€\s]/g, '').replace(',', '.');
    }
    cleanPrice = parseFloat(cleanPrice);
    
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix doit être un nombre positif valide'
      });
    }

    if (cleanPrice > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Le prix ne peut pas dépasser 1000€'
      });
    }
    
    let brunchMenu = await BrunchMenu.findOne().sort({ updatedAt: -1 });
    
    if (!brunchMenu) {
      brunchMenu = new BrunchMenu({ categories: [] });
      await brunchMenu.save();
    }

    // Handle product creation
    if (action === 'addProduct' && categoryId) {
      const category = brunchMenu.categories.find(cat => cat.id === categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier si un produit avec le même nom existe déjà
      const existingProduct = category.products.find(
        product => product.name.toLowerCase().trim() === productData.name.toLowerCase().trim()
      );
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Un produit avec ce nom existe déjà dans cette catégorie'
        });
      }

      // Create new product with generated ID and cleaned data
      const newProduct = {
        id: Date.now().toString(),
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: cleanPrice,
        quantity: productData.quantity ? productData.quantity.trim() : '',
        items: productData.items || [],
        lastItem: productData.lastItem ? productData.lastItem.trim() : '',
        isActive: productData.isActive !== undefined ? productData.isActive : true
      };

      // Add product to category
      if (!category.products) {
        category.products = [];
      }
      category.products.push(newProduct);

      brunchMenu.lastUpdated = new Date();
      await brunchMenu.save();
      
      return res.status(201).json({
        success: true,
        message: 'Produit ajouté avec succès',
        data: brunchMenu
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Requête invalide. Veuillez fournir une action et des données valides.'
    });

  } catch (error) {
    console.error('Error creating brunch menu item:', error);
    
    // Gestion spécifique des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Erreurs de validation: ${validationErrors.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du produit'
    });
  }
};
