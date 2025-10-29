import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Ingredient, Screen } from '../App';
import { 
  ArrowLeft, Plus, Edit, Trash2, MessageSquare, User, 
  Filter, Search, X, AlertTriangle, CheckCircle, Home, ChefHat 
} from 'lucide-react';

// backend api
import { listIngredients, createIngredient, updateIngredient as apiUpdateIngredient, deleteIngredient as apiDeleteIngredient, IngredientDTO } from "@/api/ingredients";
import { getIngredientImage } from "@/utils/ingredientImages";

// helpers to map api DTOs to UI models
type UIIngredient = Ingredient;

export const toUI = (d: IngredientDTO): UIIngredient => ({
  id: d.id,
  name: d.name,
  quantity: d.quantity,
  unit: d.unit,
  expiryDate: d.expiry_date ?? "",
  // category is client-only; DB 沒有這個欄位
  category: '其他',
});

export const toWirePatch = (i: Partial<UIIngredient>) => ({
  name: i.name,
  quantity: i.quantity,
  unit: i.unit,
  expiry_date: i.expiryDate || null,
});

//-------------------interface-----------------------
interface FridgeScreenProps {
  ingredients: Ingredient[];
  //onUpdateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  //onRemoveIngredient: (id: string) => void;
  onNavigate: (screen: Screen) => void;
}

export function FridgeScreen({ onNavigate 
}: FridgeScreenProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring' | 'expired' | 'no-date'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExpiryReminder, setShowExpiryReminder] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '個' as '個' | '克' | '毫升',
    expiryDate: '',
    category: ''
  });

  // // Show expiry reminder on mount
  // useEffect(() => {
  //   const expiringItems = getExpiringItems();
  //   if (expiringItems.length > 0) {
  //     setShowExpiryReminder(true);
  //   }
  // }, []);

  // Show expiry reminder whenever ingredients change
  useEffect(() => {
    const expiringItems = getExpiringItems();
    setShowExpiryReminder(expiringItems.length > 0);
  }, [ingredients]);


  // Load ingredients from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await listIngredients(); // GET /ingredients
        setIngredients(data.map(toUI)); // store in local state
      } catch (err) {
        console.error("Failed to load ingredients:", err);
      }
    }
    load();
  }, []);

  // Get unique categories, keep category purely UI-side
  const categories = useMemo(() => {
    if (!ingredients || ingredients.length === 0) return [];
    return [...new Set(ingredients.map(ing => ing.category))];
  }, [ingredients]);

  // Get expiring items (≤3 days)
  const getExpiringItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return ingredients.filter(ingredient => {
      if (!ingredient.expiryDate) return false;
      const expiry = new Date(ingredient.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return 'no-date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'fresh';
  };

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];
    
    return ingredients.filter(ingredient => {
      // Search filter
      const matchesSearch = !searchQuery || 
        ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(ingredient.category);
      
      // Expiry filter
      let matchesExpiry = true;
      if (expiryFilter !== 'all') {
        const status = getExpiryStatus(ingredient.expiryDate);
        matchesExpiry = status === expiryFilter;
      }
      
      return matchesSearch && matchesCategory && matchesExpiry;
    });
  }, [ingredients, searchQuery, selectedCategories, expiryFilter]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategories.length > 0) count++;
    if (expiryFilter !== 'all') count++;
    return count;
  }, [searchQuery, selectedCategories, expiryFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setExpiryFilter('all');
  };

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle add ingredient
  // const handleAddIngredient = () => {
  //   if (!formData.name || !formData.quantity) return;
    
  //   const newIngredient: Omit<Ingredient, 'id'> = {
  //     name: formData.name,
  //     quantity: parseFloat(formData.quantity),
  //     unit: formData.unit,
  //     expiryDate: formData.expiryDate,
  //     category: formData.category || '其他'
  //   };
    
  //   const id = Date.now().toString();
  //   onUpdateIngredient(id, newIngredient as any);
    
  //   // Reset form
  //   setFormData({
  //     name: '',
  //     quantity: '',
  //     unit: '個',
  //     expiryDate: '',
  //     category: ''
  //   });
  //   setShowAddModal(false);
  // };

  const handleAddIngredient = async () => {
    if (!formData.name || !formData.quantity) return;
    try {
      const created = await createIngredient({
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expiry_date: formData.expiryDate || null,
      });
      // Merge UI-only category
      setIngredients(prev => [{ ...toUI(created), category: formData.category || "其他" }, ...prev]);

      // Reset form & close
      setFormData({ name: "", quantity: "", unit: "個", expiryDate: "", category: "" });
      setShowAddModal(false);
    } catch (e) {
      console.error("createIngredient failed:", e);
    }
  };

  // Handle edit ingredient
  // const handleEditIngredient = () => {
  //   if (!editingItem || !formData.name || !formData.quantity) return;
    
  //   onUpdateIngredient(editingItem.id, {
  //     name: formData.name,
  //     quantity: parseFloat(formData.quantity),
  //     unit: formData.unit,
  //     expiryDate: formData.expiryDate,
  //     category: formData.category
  //   });
    
  //   setShowEditModal(false);
  //   setEditingItem(null);
  // };

  // Open edit modal
  const openEditModal = (ingredient: Ingredient) => {
    setEditingItem(ingredient);
    setFormData({
      name: ingredient.name,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
      expiryDate: ingredient.expiryDate,
      category: ingredient.category
    });
    setShowEditModal(true);
  };

  const handleEditIngredient = async () => {
    if (!editingItem || !formData.name || !formData.quantity) return;
    try {
      const updated = await apiUpdateIngredient(
        editingItem.id,
        toWirePatch({
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          expiryDate: formData.expiryDate,
        })
      );

      setIngredients(prev =>
        prev.map(it =>
          it.id === editingItem.id
            ? { ...toUI(updated), category: formData.category || it.category || "其他" }
            : it
        )
      );

      setShowEditModal(false);
      setEditingItem(null);
    } catch (e) {
      console.error("updateIngredient failed:", e);
    }
  };

  // Open delete confirm dialog
  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  // Confirm delete (API call)
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeletingItemId(itemToDelete);
    try {
      await apiDeleteIngredient(itemToDelete);
      setIngredients(prev => prev.filter(it => it.id !== itemToDelete));
    } catch (e) {
      console.error("deleteIngredient failed:", e);
    } finally {
      setDeletingItemId(null);
      setItemToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  // Format expiry date
  const formatExpiryDate = (dateString: string) => {
    if (!dateString) return '無';
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get ingredient image
  // const getIngredientImage = (name: string) => {
  //   const imageMap: Record<string, string> = {
  //     '番茄': 'https://images.unsplash.com/photo-1546470427-6c0000f0e4c9',
  //     '雞胸肉': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
  //     '牛奶': 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
  //     '雞蛋': 'https://images.unsplash.com/photo-1582722872445-44dc1f3e0eaa',
  //     '紅蘿蔔': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37'
  //   };
  //   return imageMap[name] || 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f';
  // };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .fridge-container {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .fridge-container h1, .fridge-container h2, .fridge-container h3 {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .ingredient-card {
          transition: all 0.3s ease;
          position: relative;
        }
        
        .ingredient-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
        
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="fridge-container min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FA' }}>
        {/* Top Navigation */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--menufest-white)' }}
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 
              className="m-0"
              style={{ 
                color: 'var(--menufest-white)',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}
            >
              My Fridge 🥕
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--menufest-white)' }}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'var(--menufest-orange)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            <Button
              onClick={() => {
                setFormData({
                  name: '',
                  quantity: '',
                  unit: '個',
                  expiryDate: '',
                  category: ''
                });
                setShowAddModal(true);
              }}
              className="rounded-lg px-4"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'white'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加食材
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div 
            className="slide-in p-4 border-b"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid #E0E0E0'
            }}
          >
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 
                  className="m-0"
                  style={{ 
                    color: 'var(--menufest-green)',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}
                >
                  篩選條件
                </h3>
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="rounded-lg"
                    >
                      清除全部
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                    className="rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Search */}
              <div className="space-y-2">
                <Label>搜尋食材</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="輸入食材名稱..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>類別</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className="px-3 py-1 rounded-full transition-all"
                        style={
                          selectedCategories.includes(category)
                            ? {
                                backgroundColor: 'var(--menufest-orange)',
                                color: 'white',
                                fontWeight: '600'
                              }
                            : {
                                backgroundColor: '#F0F0F0',
                                color: '#666'
                              }
                        }
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Expiry Filter */}
              <div className="space-y-2">
                <Label>保存期限</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'expiring', label: '≤3 天' },
                    { value: 'expired', label: '已過期' },
                    { value: 'no-date', label: '無日期' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExpiryFilter(option.value as any)}
                      className="px-3 py-1 rounded-full transition-all"
                      style={
                        expiryFilter === option.value
                          ? {
                              backgroundColor: 'var(--menufest-green)',
                              color: 'white',
                              fontWeight: '600'
                            }
                          : {
                              backgroundColor: '#F0F0F0',
                              color: '#666'
                            }
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6 pb-24 max-w-6xl mx-auto w-full" style={{ position: 'relative', zIndex: 0 }}>
          {filteredIngredients.length === 0 && ingredients.length === 0 ? (
            <Card className="fade-in border-0" style={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent className="p-12 text-center">
                <div 
                  className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--menufest-cream)' }}
                >
                  <span className="text-4xl">🥕</span>
                </div>
                <h3 
                  className="mb-3 m-0"
                  style={{ 
                    color: 'var(--menufest-green)',
                    fontSize: '1.5rem',
                    fontWeight: '600'
                  }}
                >
                  冰箱還是空的！
                </h3>
                <p className="text-gray-600 mb-6" style={{ fontSize: '1rem' }}>
                  開始添加食材來追蹤您的庫存吧
                </p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="rounded-lg px-6"
                  style={{ 
                    backgroundColor: 'var(--menufest-orange)',
                    color: 'white'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一個食材
                </Button>
              </CardContent>
            </Card>
          ) : filteredIngredients.length === 0 ? (
            <Card className="fade-in border-0" style={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--menufest-green)' }} />
                <h3 
                  className="mb-3 m-0"
                  style={{ 
                    color: 'var(--menufest-green)',
                    fontSize: '1.5rem',
                    fontWeight: '600'
                  }}
                >
                  找不到符合的食材
                </h3>
                <p className="text-gray-600 mb-6" style={{ fontSize: '1rem' }}>
                  試試調整您的篩選條件
                </p>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="rounded-lg"
                >
                  清除篩選
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredIngredients.map((ingredient) => (
                <Card 
                  key={ingredient.id} 
                  className={`ingredient-card fade-in border-0 ${deletingItemId === ingredient.id ? 'fade-out' : ''}`}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(27, 67, 50, 0.1)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <CardContent className="p-4">
                    {/* Image */}
                    <div className="relative mb-3">
                      <div className="aspect-square rounded-xl overflow-hidden">
                        <ImageWithFallback
                          src={getIngredientImage(ingredient.name)}
                          alt={ingredient.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {getExpiryStatus(ingredient.expiryDate) === 'expired' && (
                          <Badge 
                            className="border-0 rounded-full"
                            style={{ 
                              backgroundColor: '#DC2626',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            已過期
                          </Badge>
                        )}
                        {getExpiryStatus(ingredient.expiryDate) === 'expiring' && (
                          <Badge 
                            className="border-0 rounded-full"
                            style={{ 
                              backgroundColor: 'var(--menufest-orange)',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            即將過期
                          </Badge>
                        )}
                        {getExpiryStatus(ingredient.expiryDate) === 'fresh' && (
                          <Badge 
                            className="border-0 rounded-full"
                            style={{ 
                              backgroundColor: '#10B981',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            新鮮
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h4 
                        className="m-0 truncate"
                        style={{ 
                          color: 'var(--menufest-green)',
                          fontSize: '1.1rem',
                          fontWeight: '700'
                        }}
                      >
                        {ingredient.name}
                      </h4>
                      
                      <div className="flex items-center justify-between">
                        <span 
                          className="px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: 'var(--menufest-cream)',
                            fontSize: '0.8rem',
                            color: '#666'
                          }}
                        >
                          {ingredient.category}
                        </span>
                        <span 
                          className="text-gray-700"
                          style={{ fontSize: '0.9rem', fontWeight: '600' }}
                        >
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                      
                      <p 
                        className={`m-0 ${getExpiryStatus(ingredient.expiryDate) === 'expired' ? 'text-red-600' : 'text-gray-600'}`}
                        style={{ fontSize: '0.85rem' }}
                      >
                        📅 {formatExpiryDate(ingredient.expiryDate)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => openEditModal(ingredient)}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg"
                        style={{ borderColor: 'var(--menufest-green)', color: 'var(--menufest-green)' }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(ingredient.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg"
                        style={{ borderColor: '#DC2626', color: '#DC2626' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4" 
          style={{ 
            backgroundColor: 'var(--menufest-green)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
        >
          <div className="flex justify-around max-w-md mx-auto">
            <button 
              className="flex flex-col items-center space-y-1 p-3 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'var(--menufest-white)'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🧊</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>冰箱</span>
            </button>
            
            <button 
              onClick={() => onNavigate('menu-generator')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <ChefHat className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>菜單</span>
            </button>
            
            <button 
              onClick={() => onNavigate('profile')}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--menufest-cream)' }}
            >
              <User className="w-6 h-6" />
              <span style={{ fontSize: '0.75rem' }}>個人</span>
            </button>
          </div>
        </div>

        {/* Expiry Reminder Modal */}
        <Dialog open={showExpiryReminder} onOpenChange={setShowExpiryReminder}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--menufest-orange)' }}>
                <AlertTriangle className="w-5 h-5" />
                即將過期提醒
              </DialogTitle>
              <DialogDescription>
                查看即將過期的食材並規劃菜單
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {getExpiringItems().length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#10B981' }} />
                  <p className="text-gray-600">太好了！沒有即將過期的食材</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600" style={{ fontSize: '0.95rem' }}>
                    以下食材將在 3 天內過期：
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getExpiringItems().map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 rounded-lg flex items-center justify-between"
                        style={{ backgroundColor: '#FEF3C7' }}
                      >
                        <div>
                          <p className="m-0" style={{ fontWeight: '600', color: '#92400E' }}>
                            {item.name}
                          </p>
                          <p className="m-0" style={{ fontSize: '0.85rem', color: '#B45309' }}>
                            {item.quantity} {item.unit} · 到期日：{formatExpiryDate(item.expiryDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => setShowExpiryReminder(false)}
                      variant="outline"
                      className="flex-1 rounded-lg"
                    >
                      稍後提醒
                    </Button>
                    <Button
                      onClick={() => {
                        setShowExpiryReminder(false);
                        onNavigate('menu-generator');
                      }}
                      className="flex-1 rounded-lg"
                      style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}
                    >
                      規劃菜單
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Ingredient Modal */}
        <Dialog open={showAddModal || showEditModal} onOpenChange={(open: boolean) => {
          if (!open) {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingItem(null);
          }
        }}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--menufest-green)' }}>
                {showEditModal ? '編輯食材' : '添加食材'}
              </DialogTitle>
              <DialogDescription>
                {showEditModal ? '更新食材資訊' : '填寫食材詳細資料'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">食材名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：番茄"
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">數量 *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">單位 *</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value: '個' | '克' | '毫升') => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="個">個</SelectItem>
                      <SelectItem value="克">克</SelectItem>
                      <SelectItem value="毫升">毫升</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">保存期限</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">類別</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="例如：蔬菜、肉類、乳製品"
                  className="rounded-lg"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  取消
                </Button>
                <Button
                  onClick={showEditModal ? handleEditIngredient : handleAddIngredient}
                  disabled={!formData.name || !formData.quantity}
                  className="flex-1 rounded-lg"
                  style={{ backgroundColor: 'var(--menufest-orange)', color: 'white' }}
                >
                  {showEditModal ? '儲存' : '添加'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
              <AlertDialogDescription>
                您確定要刪除這個食材嗎？此操作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="rounded-lg">
                取消
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="rounded-lg"
                style={{ backgroundColor: '#DC2626', color: 'white' }}
              >
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
