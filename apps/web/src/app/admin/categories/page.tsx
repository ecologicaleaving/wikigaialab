'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Edit2, Plus, GripVertical, Save, X, Eye, EyeOff } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  color_hex: string;
  keywords: string[];
  order_index: number;
  is_active: boolean;
  problems_count: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon_name: string;
  color_hex: string;
  keywords: string[];
  is_active: boolean;
}

export default function AdminCategoriesPage() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon_name: 'folder',
    color_hex: '#6B7280',
    keywords: [],
    is_active: true
  });

  // Icon options
  const iconOptions = [
    'folder', 'tag', 'star', 'heart', 'home', 'user', 'settings', 'book',
    'briefcase', 'globe', 'shield', 'zap', 'camera', 'music', 'phone'
  ];

  // Color options
  const colorOptions = [
    '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'
  ];

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchCategories();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?includeInactive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      await fetchCategories();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating category');
    }
  };

  const handleUpdate = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      await fetchCategories();
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !category.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle category status');
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating category');
    }
  };

  const handleReorder = async (dragIndex: number, hoverIndex: number) => {
    const newCategories = [...categories];
    const draggedCategory = newCategories[dragIndex];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, draggedCategory);

    // Update local state optimistically
    setCategories(newCategories);

    // Send reorder request
    try {
      const categoryIds = newCategories.map(cat => cat.id);
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }
    } catch (err) {
      // Revert on error
      fetchCategories();
      setError(err instanceof Error ? err.message : 'Error reordering categories');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon_name: category.icon_name,
      color_hex: category.color_hex,
      keywords: category.keywords || [],
      is_active: category.is_active
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'folder',
      color_hex: '#6B7280',
      keywords: [],
      is_active: true
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    resetForm();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Devi essere autenticato per accedere a questa pagina.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Accesso riservato agli amministratori.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestione Categorie</h1>
                <p className="text-gray-600 mt-1">Gestisci le categorie dei problemi</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuova Categoria
              </button>
            </div>
          </div>

          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 mt-2 text-sm underline"
              >
                Chiudi
              </button>
            </div>
          )}

          <div className="p-6">
            {/* Create Form */}
            {showCreateForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Crea Nuova Categoria</h3>
                <CategoryForm
                  formData={formData}
                  setFormData={setFormData}
                  iconOptions={iconOptions}
                  colorOptions={colorOptions}
                  onSave={handleCreate}
                  onCancel={cancelEdit}
                />
              </div>
            )}

            {/* Categories List */}
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg ${
                    category.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {editingId === category.id ? (
                    <CategoryForm
                      formData={formData}
                      setFormData={setFormData}
                      iconOptions={iconOptions}
                      colorOptions={colorOptions}
                      onSave={() => handleUpdate(category.id)}
                      onCancel={cancelEdit}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: category.color_hex }}
                        >
                          {category.icon_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                            <span className="text-sm text-gray-500">
                              ({category.problems_count || 0} problemi)
                            </span>
                            {!category.is_active && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                Disattivata
                              </span>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-gray-600 text-sm">{category.description}</p>
                          )}
                          {category.keywords && category.keywords.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {category.keywords.slice(0, 3).map((keyword, i) => (
                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                              {category.keywords.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{category.keywords.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`p-2 rounded-lg ${
                            category.is_active
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={category.is_active ? 'Disattiva' : 'Attiva'}
                        >
                          {category.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Modifica"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nessuna categoria trovata.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  iconOptions: string[];
  colorOptions: string[];
  onSave: () => void;
  onCancel: () => void;
}

function CategoryForm({
  formData,
  setFormData,
  iconOptions,
  colorOptions,
  onSave,
  onCancel
}: CategoryFormProps) {
  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !formData.keywords.includes(keyword.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword.trim()]
      });
    }
  };

  const handleKeywordRemove = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nome categoria"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Descrizione categoria"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icona
        </label>
        <select
          value={formData.icon_name}
          onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {iconOptions.map(icon => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Colore
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.color_hex}
            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
          <select
            value={formData.color_hex}
            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {colorOptions.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords (premere Invio per aggiungere)
        </label>
        <input
          type="text"
          placeholder="Aggiungi keyword..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleKeywordAdd(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        {formData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleKeywordRemove(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Categoria attiva</span>
        </label>
      </div>

      <div className="md:col-span-2 flex gap-2">
        <button
          onClick={onSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Salva
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Annulla
        </button>
      </div>
    </div>
  );
}