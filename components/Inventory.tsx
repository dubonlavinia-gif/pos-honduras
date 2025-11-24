
import React, { useEffect, useState } from 'react';
import { getProducts, saveProduct } from '../services/db';
import { Product, CATEGORY_PREFIXES, PRODUCT_CATEGORIES, ProductCategory } from '../types';
import { Plus, Search, Edit, RefreshCw } from 'lucide-react';

interface InventoryProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Inventory: React.FC<InventoryProps> = ({ notify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '', 
    sku: '',
    cost_price: 0,
    sell_price: 0,
    stock: 0,
    min_stock: 5
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  // Generador de SKU Secuencial Inteligente
  const generateSequentialSku = (category: string): string => {
    // Validar que la categoría sea válida según nuestra lista oficial
    if (!Object.keys(CATEGORY_PREFIXES).includes(category)) return '';
    
    const prefix = CATEGORY_PREFIXES[category as ProductCategory];

    // Filtrar productos que tengan este prefijo
    const categoryProducts = products.filter(p => p.sku && p.sku.startsWith(prefix + '-'));
    
    // Extraer los números
    const numbers = categoryProducts.map(p => {
      const parts = p.sku.split('-');
      // Asumimos formato PREFIJO-XXXX
      return parts.length > 1 ? parseInt(parts[1]) : 0;
    }).filter(n => !isNaN(n));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    // Formatear con 4 dígitos (0001, 0002, etc.)
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        sku: product.sku,
        cost_price: product.cost_price,
        sell_price: product.sell_price,
        stock: product.stock,
        min_stock: product.min_stock
      });
    } else {
      setEditingProduct(null);
      // Valores por defecto
      setFormData({ 
        name: '', 
        description: '',
        category: '', // Obligar al usuario a elegir
        sku: '', 
        cost_price: 0, 
        sell_price: 0, 
        stock: 0, 
        min_stock: 5 
      });
    }
    setIsModalOpen(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    
    // Si estamos editando y ya tiene un SKU, NO cambiarlo automáticamente a menos que sea explícito (aquí protegemos el SKU existente)
    // Si estamos creando un nuevo producto, O si el SKU está vacío, generar uno nuevo basado en el prefijo
    if (!editingProduct && newCategory) {
       const newSku = generateSequentialSku(newCategory);
       setFormData({ ...formData, category: newCategory, sku: newSku });
    } else {
       setFormData({ ...formData, category: newCategory });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.category) {
        notify("Por favor selecciona una categoría de la lista oficial", "error");
        setLoading(false);
        return;
      }

      // Validar SKU si se modificó manualmente
      const finalSku = formData.sku.trim();
      if (finalSku) {
        const exists = products.some(p => p.sku === finalSku && p.id !== editingProduct?.id);
        if (exists) {
            notify("El código SKU ya existe. Intenta generar otro.", "error");
            setLoading(false);
            return;
        }
      } else {
        // Fallback: Generar si está vacío
        const generated = generateSequentialSku(formData.category);
        if(!generated) {
            notify("Error generando SKU. Seleccione categoría nuevamente.", "error");
            setLoading(false);
            return;
        }
      }

      // LIMPIEZA DE DATOS NUMÉRICOS
      // Convertimos explícitamente a Number para evitar problemas de strings o ceros a la izquierda
      await saveProduct({
        ...formData,
        sku: finalSku,
        cost_price: Number(formData.cost_price),
        sell_price: Number(formData.sell_price),
        stock: Number(formData.stock),
        min_stock: Number(formData.min_stock),
        id: editingProduct?.id
      });

      setIsModalOpen(false);
      await loadProducts();
      notify(editingProduct ? "Producto actualizado" : `Producto creado: ${finalSku}`, "success");
    } catch (error: any) {
      console.error("Error saving product detailed:", error);
      // Extraemos el mensaje real del error para mostrarlo
      const errorMsg = error.message || error.error_description || JSON.stringify(error);
      notify(`Error al guardar: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Inventario de Productos</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre, SKU o categoría..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Cargando inventario...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P. Venta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono font-bold">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{product.name}</div>
                    {product.description && <div className="text-xs text-gray-400">{product.description}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs border border-slate-200 font-semibold">
                        {product.category || 'Sin Cat.'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 font-bold">L. {product.sell_price.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-700'}`}>
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-900">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Categoría Oficial <span className="text-red-500">*</span></label>
                    <select 
                        required
                        className="mt-1 w-full border rounded p-2 bg-blue-50 border-blue-200 font-medium"
                        value={formData.category}
                        onChange={handleCategoryChange}
                    >
                        <option value="">-- Seleccionar Categoría --</option>
                        {PRODUCT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">El SKU se generará automáticamente según la categoría (ej: CAR-0001).</p>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Producto <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  className="mt-1 w-full border rounded p-2"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <input 
                  type="text" 
                  className="mt-1 w-full border rounded p-2"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SKU / Código</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    className="mt-1 w-full border rounded p-2 bg-gray-100 font-mono text-slate-600 font-bold"
                    value={formData.sku}
                    placeholder="Se genera al elegir categoría"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Costo (Compra) <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value ? parseFloat(e.target.value) : 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Venta <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.sell_price}
                    onChange={e => setFormData({...formData, sell_price: e.target.value ? parseFloat(e.target.value) : 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value ? parseInt(e.target.value) : 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.min_stock}
                    onChange={e => setFormData({...formData, min_stock: e.target.value ? parseInt(e.target.value) : 0})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 shadow-lg"
                >
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
