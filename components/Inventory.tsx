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
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    sku: string;
    cost_price: string | number;
    sell_price: string | number;
    stock: string | number;
    min_stock: string | number;
  }>({
    name: '',
    description: '',
    category: '', 
    sku: '',
    cost_price: '',
    sell_price: '',
    stock: '',
    min_stock: ''
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

  // Lógica OBLIGATORIA: Prefijo de Categoría + Aleatorio
  const generateSkuFromCategory = (category: string): string => {
    if (!category) return '';
    
    // 1. Obtener prefijo exacto del mapa
    const prefix = CATEGORY_PREFIXES[category as ProductCategory];
    
    // Si la categoría no está en el mapa, usar GEN (fallback de seguridad)
    if (!prefix) return `GEN-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Generar número aleatorio de 4 dígitos (ej: 8392)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    // 3. Retornar formato PREFIX-NUMBER
    return `${prefix}-${randomNum}`;
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
      setFormData({ 
        name: '', 
        description: '',
        category: '', 
        sku: '', 
        cost_price: '', 
        sell_price: '', 
        stock: '', 
        min_stock: '' 
      });
    }
    setIsModalOpen(true);
  };

  // Manejador del Selector de Categoría
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    
    // Solo regeneramos el SKU si estamos creando un producto nuevo o el usuario lo desea explícitamente
    // Si estamos editando, respetamos el SKU existente a menos que se quiera cambiar manualmente
    if (!editingProduct && newCategory) {
       const newSku = generateSkuFromCategory(newCategory);
       setFormData(prev => ({ 
           ...prev, 
           category: newCategory, 
           sku: newSku // Actualización INMEDIATA del SKU
       }));
    } else {
       setFormData(prev => ({ ...prev, category: newCategory }));
    }
  };

  const regenerateSku = () => {
      if (!formData.category) {
          alert("Seleccione una categoría primero.");
          return;
      }
      const newSku = generateSkuFromCategory(formData.category);
      setFormData(prev => ({ ...prev, sku: newSku }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validación básica
      if (!formData.category) {
        alert("Error: Debes seleccionar una categoría obligatoriamente.");
        setLoading(false);
        return;
      }

      // Sanitización de números
      const costClean = parseFloat(Number(formData.cost_price).toString());
      const sellClean = parseFloat(Number(formData.sell_price).toString());
      const stockClean = parseInt(Number(formData.stock).toString());
      const minStockClean = parseInt(Number(formData.min_stock).toString());

      if (isNaN(costClean) || isNaN(sellClean)) {
        alert("Error: Costo o Precio de venta inválidos.");
        setLoading(false);
        return;
      }

      // Asegurar SKU final
      let finalSku = formData.sku.trim();
      if (!finalSku) {
         finalSku = generateSkuFromCategory(formData.category);
      }

      const productPayload = {
        name: formData.name.trim(),
        sku: finalSku,
        description: formData.description?.trim() || '', // Enviar vacío si no hay
        category: formData.category,
        cost_price: costClean,
        sell_price: sellClean,
        stock: stockClean,
        min_stock: minStockClean,
        id: editingProduct?.id
      };

      console.log("Enviando a Supabase:", productPayload);

      await saveProduct(productPayload);

      setIsModalOpen(false);
      await loadProducts();
      window.alert("¡Producto guardado correctamente!");
      
    } catch (error: any) {
      console.error("Error Supabase CRÍTICO:", error);
      
      // Extracción robusta del mensaje de error para evitar [object Object]
      let errorMessage = "Error desconocido";
      let errorDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
         errorMessage = error.message || error.error_description || JSON.stringify(error);
         errorDetails = error.details || error.hint || "";
      } else {
         errorMessage = String(error);
      }
      
      window.alert(`ERROR BASE DE DATOS:\n${errorMessage}\n${errorDetails ? '\nDetalles: ' + errorDetails : ''}\n\n(IMPORTANTE: Ejecuta el script SQL en Supabase para crear la columna 'description')`);
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
                        className="mt-1 w-full border rounded p-2 bg-blue-50 border-blue-200 font-medium cursor-pointer"
                        value={formData.category}
                        onChange={handleCategoryChange}
                    >
                        <option value="">-- Seleccionar Categoría --</option>
                        {PRODUCT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
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
                  placeholder="Ej. Coca Cola 3L"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <input 
                  type="text" 
                  className="mt-1 w-full border rounded p-2"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalles adicionales (Opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SKU / Código</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    className="mt-1 w-full border rounded p-2 bg-gray-100 font-mono text-slate-800 font-bold border-gray-300"
                    value={formData.sku}
                    placeholder="Seleccione Categoría para generar"
                  />
                   <button 
                    type="button" 
                    onClick={regenerateSku}
                    className="bg-gray-200 px-3 rounded text-gray-600 hover:bg-gray-300"
                    title="Regenerar Código"
                   >
                       <RefreshCw size={16}/>
                   </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Formato: PREFIJO + NÚMERO ALEATORIO</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Costo (Compra) <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Venta <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.sell_price}
                    onChange={e => setFormData({...formData, sell_price: e.target.value})}
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
                    placeholder="0"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    placeholder="5"
                    className="mt-1 w-full border rounded p-2"
                    value={formData.min_stock}
                    onChange={e => setFormData({...formData, min_stock: e.target.value})}
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