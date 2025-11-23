import React, { useEffect, useState } from 'react';
import { getProducts, createPurchase } from '../services/db';
import { Product, PurchaseItem } from '../types';
import { Search, Plus, Truck, Save } from 'lucide-react';

interface PurchasesProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Purchases: React.FC<PurchasesProps> = ({ notify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const addToPurchase = (product: Product) => {
    if (purchaseItems.find(p => p.product_id === product.id)) return;
    
    setPurchaseItems([
      ...purchaseItems,
      { 
        product_id: product.id, 
        quantity: 1, 
        unit_cost: product.cost_price // Default to current cost
      }
    ]);
  };

  const updateItem = (id: string, field: 'quantity' | 'unit_cost', value: number) => {
    setPurchaseItems(items => items.map(item => 
      item.product_id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setPurchaseItems(items => items.filter(i => i.product_id !== id));
  };

  const handleSavePurchase = async () => {
    if (!supplierName || purchaseItems.length === 0) {
        notify("Ingrese proveedor y seleccione productos", "error");
        return;
    }
    
    setIsProcessing(true);

    try {
      const total = purchaseItems.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0);
      
      await createPurchase({
          supplier_name: supplierName,
          total_amount: total,
          items: purchaseItems
      });

      setPurchaseItems([]);
      setSupplierName('');
      await loadProducts(); // Refresh to show updated stock/cost
      notify("Compra registrada y stock actualizado", "success");
    } catch (error) {
      console.error("Error registering purchase:", error);
      notify("Error al registrar la compra", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Registro de Compras a Proveedores</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search & Add */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Buscar producto existente..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-0">
                            <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-gray-500">Stock actual: {p.stock} | Costo Actual: L. {p.cost_price}</p>
                            </div>
                            <button 
                                onClick={() => addToPurchase(p)}
                                className="bg-indigo-100 text-indigo-700 p-2 rounded hover:bg-indigo-200"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 italic">* Para productos nuevos, regístralos primero en Inventario.</p>
            </div>

            {/* Purchase Order */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col h-full">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Truck size={20}/> Orden de Compra</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Nombre del Proveedor</label>
                    <input 
                        type="text" 
                        className="w-full border rounded p-2 mt-1"
                        value={supplierName}
                        onChange={e => setSupplierName(e.target.value)}
                        placeholder="Ej. Distribuidora Lima"
                    />
                </div>

                <div className="flex-1 overflow-y-auto border rounded-lg mb-4">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Producto</th>
                                <th className="p-2 w-20">Cant.</th>
                                <th className="p-2 w-24">Costo Unit. (L.)</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseItems.map(item => {
                                const prod = products.find(p => p.id === item.product_id);
                                return (
                                    <tr key={item.product_id} className="border-b">
                                        <td className="p-2 truncate max-w-[150px]">{prod?.name}</td>
                                        <td className="p-2">
                                            <input 
                                                type="number" min="1"
                                                className="w-full border rounded p-1"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.product_id, 'quantity', parseInt(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" min="0" step="0.01"
                                                className="w-full border rounded p-1"
                                                value={item.unit_cost}
                                                onChange={e => updateItem(item.product_id, 'unit_cost', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <button onClick={() => removeItem(item.product_id)} className="text-red-500 font-bold">×</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold mb-4">
                        <span>Total Compra:</span>
                        <span>L. {purchaseItems.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0).toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handleSavePurchase}
                        disabled={isProcessing}
                        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 flex justify-center items-center gap-2 disabled:bg-indigo-400"
                    >
                        <Save size={18} /> {isProcessing ? 'Procesando...' : 'Registrar Compra'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};