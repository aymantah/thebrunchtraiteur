import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  Coffee, 
  ChefHat, 
  Sparkles,
  Edit,
  Trash2,
  Plus,
  Home,
  Menu as MenuIcon,
  Save,
  X,
  Upload
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState('lunch');
  const [brunchData, setBrunchData] = useState({ categories: [] });
  const [lunchData, setLunchData] = useState({ categories: [] });
  const [reveillonData, setReveillonData] = useState({ categories: [], plateaux: [] });
  const [loading, setLoading] = useState(true);

  // Estados para modals de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(''); // 'product', 'plateau'
  const [editingMenuType, setEditingMenuType] = useState(''); // 'lunch', 'brunch', 'reveillon'
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    price: '',
    quantity: '',
    isPremium: false,
    isActive: true,
    image: '',
    items: [],
    lastItem: ''
  });
  
  // États pour l'upload d'image
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // États pour la validation des erreurs
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction de validation des champs
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validation du nom
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Le nom est obligatoire';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    // Validation de la description
    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'La description est obligatoire';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'La description doit contenir au moins 10 caractères';
    }
    
    // Validation du prix
    if (!formData.price || formData.price.toString().trim().length === 0) {
      errors.price = 'Le prix est obligatoire';
    } else {
      // Nettoyer le prix (enlever €, espaces, etc.)
      const cleanPrice = formData.price.toString().replace(/[€\s]/g, '').replace(',', '.');
      const priceNum = parseFloat(cleanPrice);
      
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = 'Le prix doit être un nombre positif';
      } else if (priceNum > 1000) {
        errors.price = 'Le prix ne peut pas dépasser 1000€';
      }
    }
    
    // Validation spécifique pour les plateaux
    if (editingType === 'plateau') {
      if (!formData.items || formData.items.length === 0 || 
          (formData.items.length === 1 && formData.items[0].trim().length === 0)) {
        errors.items = 'Au moins un item est obligatoire pour un plateau';
      }
    }
    
    // Validation spécifique pour les produits
    if (editingType === 'product') {
      if (formData.quantity && formData.quantity.trim().length > 0) {
        // Si une quantité est spécifiée, elle doit être valide
        const quantity = formData.quantity.trim();
        if (quantity.length < 2) {
          errors.quantity = 'La quantité doit être plus descriptive (ex: "10 pièces")';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour nettoyer les données avant envoi
  const cleanFormData = () => {
    const cleanedData = { ...formData };
    
    // Nettoyer le prix
    if (cleanedData.price) {
      const cleanPrice = cleanedData.price.toString().replace(/[€\s]/g, '').replace(',', '.');
      cleanedData.price = cleanPrice;
    }
    
    // Nettoyer les champs texte
    cleanedData.name = cleanedData.name.trim();
    cleanedData.description = cleanedData.description.trim();
    if (cleanedData.quantity) {
      cleanedData.quantity = cleanedData.quantity.trim();
    }
    
    // Nettoyer les items pour les plateaux
    if (editingType === 'plateau' && cleanedData.items) {
      cleanedData.items = cleanedData.items
        .filter(item => item && item.trim().length > 0)
        .map(item => item.trim());
      
      if (cleanedData.lastItem) {
        cleanedData.lastItem = cleanedData.lastItem.trim();
      }
    }
    
    return cleanedData;
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAllMenus();
  }, [navigate]);

  const fetchAllMenus = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [brunchResponse, lunchResponse, reveillonResponse] = await Promise.all([
        fetch('http://localhost:5000/api/brunch/admin', { headers }),
        fetch('http://localhost:5000/api/lunch/admin', { headers }),
        fetch('http://localhost:5000/api/reveillon/admin', { headers })
      ]);

      const brunch = await brunchResponse.json();
      const lunch = await lunchResponse.json();
      const reveillon = await reveillonResponse.json();

      if (brunch.success) setBrunchData(brunch.data);
      if (lunch.success) setLunchData(lunch.data);
      if (reveillon.success) setReveillonData(reveillon.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Déclencher l'événement de changement d'état d'auth
    window.dispatchEvent(new Event('authStateChange'));
    
    navigate('/admin/login');
  };

  const editProduct = (menuType, categoryId, productId) => {
    let item = null;
    let itemType = '';

    // Buscar o item nos dados
    if (menuType === 'reveillon') {
      item = reveillonData.plateaux?.find(p => (p._id || p.id) === productId);
      itemType = 'plateau';
    } else if (menuType === 'brunch') {
      const category = brunchData.categories?.find(c => c.id === categoryId);
      item = category?.products?.find(p => (p._id || p.id) === productId);
      itemType = 'product';
    } else if (menuType === 'lunch') {
      const category = lunchData.categories?.find(c => c.id === categoryId);
      item = category?.products?.find(p => (p._id || p.id) === productId);
      itemType = 'product';
    }

    if (item) {
      // Configurar os dados do formulário
      setFormData({
        name: item.name || '',
        title: item.title || '',
        description: item.description || '',
        price: item.price || '',
        quantity: item.quantity || '',
        isPremium: item.isPremium || false,
        isActive: item.isActive !== undefined ? item.isActive : true,
        image: item.image || '',
        items: item.items || [],
        lastItem: item.lastItem || ''
      });

      setEditingItem(item);
      setEditingType(itemType);
      setEditingMenuType(menuType);
      setEditingCategoryId(categoryId);
      setEditModalOpen(true);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ quand l'utilisateur commence à taper
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Fonction pour ajouter un nouveau produit
  const handleAddProduct = (menuType, categoryId) => {
    // Réinitialiser le formulaire pour un nouveau produit
    setFormData({
      name: '',
      title: '',
      description: '',
      price: '',
      quantity: '',
      isPremium: false,
      isActive: true,
      image: '',
      items: [],
      lastItem: ''
    });

    setEditingItem(null); // Pas d'item en cours d'édition
    setEditingType('product');
    setEditingMenuType(menuType);
    setEditingCategoryId(categoryId);
    setEditModalOpen(true);
  };

  // Fonction pour ajouter un nouveau plateau (réveillon)
  const handleAddPlateau = (menuType) => {
    // Réinitialiser le formulaire pour un nouveau plateau
    setFormData({
      name: '',
      title: '',
      description: '',
      price: '',
      quantity: '',
      isPremium: false,
      isActive: true,
      image: '',
      items: [],
      lastItem: ''
    });

    setEditingItem(null); // Pas d'item en cours d'édition
    setEditingType('plateau');
    setEditingMenuType(menuType);
    setEditingCategoryId(null);
    setEditModalOpen(true);
  };

  // Fonction pour sauvegarder (création ou modification)const handleSaveProduct = async () => {
  setFormErrors({});

  if (!validateForm()) {
    toast({
      title: "Erreurs de validation",
      description: "Veuillez corriger les erreurs dans le formulaire",
      variant: "destructive",
    });
    return;
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    navigate('/admin/login');
    return;
  }

  setIsSubmitting(true);

  try {
    const cleanedFormData = cleanFormData();

    let endpoint = '';
    let method = 'POST';
    let bodyData = cleanedFormData;

    /* ============================
       MENU REVEILLON (PLATEAUX)
    ============================ */
    if (editingMenuType === 'reveillon') {
      const plateauId = editingItem?._id || editingItem?.id;

      if (editingItem) {
        // UPDATE plateau
        endpoint = `http://localhost:5000/api/reveillon/admin/plateau/${plateauId}`;
        method = 'PUT';
      } else {
        // CREATE plateau
        endpoint = `http://localhost:5000/api/reveillon/admin/plateau`;
        method = 'POST';
      }
    }

    /* ============================
       LUNCH / BRUNCH (logique actuelle)
    ============================ */
    else {
      endpoint = `http://localhost:5000/api/${editingMenuType}/admin`;

      if (editingItem) {
        method = 'PUT';
        bodyData = {
          action: 'updateProduct',
          itemId: editingItem._id || editingItem.id,
          categoryId: editingCategoryId,
          updates: cleanedFormData
        };
      } else {
        method = 'POST';
        bodyData = {
          action: 'addProduct',
          categoryId: editingCategoryId,
          productData: cleanedFormData
        };
      }
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();

    if (response.ok) {
      toast({
        title: "Succès",
        description: editingItem
          ? "Produit modifié avec succès"
          : "Produit créé avec succès",
      });

      setEditModalOpen(false);
      fetchAllMenus();
    } else {
      toast({
        title: "Erreur",
        description: result.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    }

  } catch (error) {
    console.error(error);
    toast({
      title: "Erreur serveur",
      description: "Impossible de contacter le serveur",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  // Fonction pour uploader l'image vers Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const token = localStorage.getItem('adminToken');
      console.log('Uploading file:', file.name, file.type, file.size);
      console.log('Token present:', !!token);
      
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Mettre à jour l'URL de l'image dans le formulaire
        handleFormChange('image', data.data.url);
        alert('Image uploadée avec succès !');
      } else {
        console.error('Erreur lors de l\'upload de l\'image:', data);
        alert(`Erreur: ${data.message || 'Erreur lors de l\'upload de l\'image'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors de l\'upload de l\'image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setFormErrors({}); // Réinitialiser les erreurs
    setIsSubmitting(false); // Réinitialiser l'état de soumission
    setFormData({
      name: '',
      title: '',
      description: '',
      price: '',
      quantity: '',
      isPremium: false,
      isActive: true,
      image: '',
      items: [],
      lastItem: ''
    });
  };

  const deleteProduct = async (menuType, categoryId, productId) => {
  const token = localStorage.getItem('adminToken');
  const confirmed = window.confirm('Supprimer cet élément ?');

  if (!confirmed) return;

  try {
    /* ========= REVEILLON ========= */
    if (menuType === 'reveillon') {
      await fetch(
        `http://localhost:5000/api/reveillon/admin/plateau/${productId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      fetchAllMenus();
      return;
    }

    /* ========= LUNCH / BRUNCH ========= */
    await fetch(`http://localhost:5000/api/${menuType}/admin`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'deleteProduct',
        categoryId,
        productId
      })
    });

    fetchAllMenus();

  } catch (error) {
    console.error('Error deleting product:', error);
  }
};


  const renderProductTable = (data, menuType) => {
    if (menuType === 'reveillon') {
      // Special handling for réveillon menu (plateaux)
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MenuIcon className="h-5 w-5" />
              Plateaux Réveillon
              <Badge variant="secondary">{data.plateaux.length} plateaux</Badge>
            </CardTitle>
            <Button 
              className="bg-gradient-to-r from-[#cbb36f] to-[#99771b] hover:from-[#b8a060] hover:to-[#856818]"
              onClick={() => handleAddPlateau('reveillon')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un plateau
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.plateaux.map((plateau) => (
                  <TableRow key={plateau._id || plateau.id}>
                    <TableCell className="font-medium">{plateau.title}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate" title={plateau.description}>
                        {plateau.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#99771b] border-[#99771b]">
                        {plateau.price}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {plateau.items?.length || 0} items
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => editProduct(menuType, null, plateau._id || plateau.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteProduct(menuType, null, plateau._id || plateau.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    // Regular handling for brunch and lunch menus (categories)
    const categories = data.categories;
    if (!categories || categories.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun produit trouvé</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue={categories[0]?.id} className="w-full">
        <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#cbb36f] data-[state=active]:to-[#99771b] data-[state=active]:text-white"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MenuIcon className="h-5 w-5" />
                  {category.name}
                  <Badge variant="secondary">{category.products?.length || 0} produits</Badge>
                </CardTitle>
                <Button 
                  className="bg-gradient-to-r from-[#cbb36f] to-[#99771b] hover:from-[#b8a060] hover:to-[#856818]"
                  onClick={() => handleAddProduct(menuType, category.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </CardHeader>
              <CardContent>
                {category.products && category.products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.products.map((product) => (
                        <TableRow key={product._id || product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="truncate" title={product.description}>
                              {product.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[#99771b] border-[#99771b]">
                              {product.price}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => editProduct(menuType, category.id, product._id || product.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteProduct(menuType, category.id, product._id || product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun produit dans cette catégorie</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">Tableau de bord</h1>
        </div>
        
        <nav className="p-4 flex-1">
          <div className="space-y-2">
            <a
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 border-b border-gray-200 mb-4 pb-3"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </a>
            <button
              onClick={() => setActiveMenu('lunch')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'lunch' 
                  ? 'bg-gradient-to-r from-[#cbb36f] to-[#99771b] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              Menu Lunch
            </button>

            <button
              onClick={() => setActiveMenu('brunch')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'brunch' 
                  ? 'bg-gradient-to-r from-[#cbb36f] to-[#99771b] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Coffee className="h-5 w-5" />
              Menu Brunch
            </button>
            
            <button
              onClick={() => setActiveMenu('reveillon')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'reveillon' 
                  ? 'bg-gradient-to-r from-[#cbb36f] to-[#99771b] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              Menu Réveillon
            </button>
          </div>
        </nav>

        <div className="p-4 border-t">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeMenu === 'brunch' && 'Gestion du Menu Brunch'}
                {activeMenu === 'lunch' && 'Gestion du Menu Lunch'}
                {activeMenu === 'reveillon' && 'Gestion du Menu Réveillon'}
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les catégories et produits de votre menu
              </p>
            </div>
          </div>
        </header>

        <main className="p-6 overflow-y-auto h-[calc(100vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#99771b] mx-auto mb-4"></div>
                <p>Chargement des menus...</p>
              </div>
            </div>
          ) : (
            <>
              {activeMenu === 'brunch' && renderProductTable(brunchData, 'brunch')}
              {activeMenu === 'lunch' && renderProductTable(lunchData, 'lunch')}
              {activeMenu === 'reveillon' && renderProductTable(reveillonData, 'reveillon')}
            </>
          )}
        </main>
      </div>

      {/* Modal d'édition */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingItem 
                ? (editingType === 'plateau' ? 'Modifier le Plateau' : 'Modifier le Produit')
                : (editingType === 'plateau' ? 'Ajouter un Plateau' : 'Ajouter un Produit')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom/Titre */}
            <div className="space-y-2">
              <Label htmlFor="name" className={formErrors.name ? 'text-red-500' : ''}>
                {editingType === 'plateau' ? 'Titre du plateau' : 'Nom du produit'}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={editingType === 'plateau' ? formData.title : formData.name}
                onChange={(e) => handleFormChange(editingType === 'plateau' ? 'title' : 'name', e.target.value)}
                placeholder={editingType === 'plateau' ? 'Entrez le titre du plateau' : 'Entrez le nom du produit'}
                className={formErrors.name ? 'border-red-500 focus:border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className={formErrors.description ? 'text-red-500' : ''}>
                Description
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description du produit"
                rows={3}
                className={formErrors.description ? 'border-red-500 focus:border-red-500' : ''}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
              )}
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <Label htmlFor="price" className={formErrors.price ? 'text-red-500' : ''}>
                Prix
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                placeholder="Ex: 15€"
                className={formErrors.price ? 'border-red-500 focus:border-red-500' : ''}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
              )}
              <p className="text-sm text-gray-500">Il faut saisir le prix avec le symbole €</p>
            </div>

            {/* Quantité - seulement pour les produits */}
            {editingType === 'product' && (
              <div className="space-y-2">
                <Label htmlFor="quantity" className={formErrors.quantity ? 'text-red-500' : ''}>
                  Quantité (optionnel)
                </Label>
                <Input
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                  placeholder="Ex: 10 pièces"
                  className={formErrors.quantity ? 'border-red-500 focus:border-red-500' : ''}
                />
                {formErrors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.quantity}</p>
                )}
              </div>
            )}

            {/* Items - seulement pour les plateaux */}
            {editingType === 'plateau' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="items" className={formErrors.items ? 'text-red-500' : ''}>
                    Items du plateau (un par ligne)
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="items"
                    value={formData.items.join('\n')}
                    onChange={(e) => handleFormChange('items', e.target.value.split('\n'))}
                    placeholder="Burger Brioché&#10;Natte Viennoise&#10;..."
                    rows={4}
                    className={formErrors.items ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {formErrors.items && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.items}</p>
                  )}
                  <p className="text-sm text-gray-500">Saisissez chaque item sur une ligne séparée</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastItem">Dernier item</Label>
                  <Input
                    id="lastItem"
                    value={formData.lastItem}
                    onChange={(e) => handleFormChange('lastItem', e.target.value)}
                    placeholder="Pepper poulet"
                  />
                </div>
              </>
            )}

            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Image du produit</Label>
              <div className="flex space-x-2">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => handleFormChange('image', e.target.value)}
                  placeholder="/images/card1.jpg"
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    className="whitespace-nowrap flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingImage ? 'Upload...' : 'Uploader'}
                  </Button>
                </div>
              </div>
              {/* Prévisualisation de l'image */}
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Prévisualisation"
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Switches */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPremium">Produit Premium</Label>
                <Switch
                  id="isPremium"
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => handleFormChange('isPremium', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Produit Actif</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-gradient-to-r from-[#cbb36f] to-[#99771b] hover:from-[#b8a060] hover:to-[#856818]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingItem ? 'Enregistrer' : 'Ajouter'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
