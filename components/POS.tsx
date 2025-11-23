import React, { useEffect, useState } from 'react';
import { getProducts, createSale } from '../services/db';
import { Product, CartItem, Sale } from '../types';
import { Search, ShoppingCart, Trash2, CheckCircle, Plus, Minus, Printer, Receipt } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface POSProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const POS: React.FC<POSProps> = ({ notify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      notify("Producto sin stock disponible", "error");
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        notify("No hay más stock disponible de este producto", "error");
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const generateReceipt = (sale: Sale) => {
    if (!sale) return;

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 200] // Ticket format width 80mm
    });

    doc.setFontSize(12);
    doc.text("POS Honduras", 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text("Ticket de Venta", 40, 15, { align: 'center' });
    doc.text(`ID: ${sale.id.slice(0, 8)}`, 40, 19, { align: 'center' });
    doc.text(`Fecha: ${new Date(sale.created_at).toLocaleString()}`, 40, 23, { align: 'center' });

    // Need to cast items because sale.items might come from DB structure or local mapping
    // Assuming sale object passed here matches the structure
    const rows = sale.items.map((item: any) => [
      item.product_name.substring(0, 15),
      item.quantity.toString(),
      `L. ${(item.unit_price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Desc', 'Cant', 'Total']],
      body: rows,
      startY: 26,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.text(`TOTAL: L. ${sale.total_amount.toFixed(2)}`, 5, finalY);
    doc.text(`Pago: ${sale.payment_method}`, 5, finalY + 5);
    
    doc.text("¡Gracias por su compra!", 40, finalY + 15, { align: 'center' });

    doc.save(`recibo_${sale.id.slice(0,8)}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const saleData = {
        total_amount: cartTotal,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.sell_price,
          unit_cost: item.cost_price // Snapshot of cost
        }))
      };

      const newSale = await createSale(saleData);
      
      if (newSale) {
        // Set the newly created sale as the "last sale" for the modal
        // Note: The backend returns the sale header, we need to merge items to print immediately
        const fullSale: any = { ...newSale, items: saleData.items, created_at: new Date().toISOString() };
        setLastSale(fullSale);
        
        setCart([]);
        await fetchProducts(); // Refresh stock from DB
        setShowSuccessModal(true);
        notify("Venta registrada correctamente", "success");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      notify("Hubo un error al procesar la venta.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
      {/* Product List (Left) */}
      <div className="flex-1 flex flex-col space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Catálogo de Productos</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 content-start">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className={`p-4 bg-white rounded-lg shadow border hover:border-blue-400 cursor-pointer transition-all ${product.stock === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
            >
              <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-emerald-600">L. {product.sell_price.toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart (Right) */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg flex flex-col border border-gray-200">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} /> Carrito de Venta
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <ShoppingCart className="mx-auto mb-2" size={48} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 border-b">
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">L. {item.sell_price.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100"><Minus size={14} /></button>
                    <span className="px-2 text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100"><Plus size={14} /></button>
                  </div>
                  <p className="font-bold text-sm w-16 text-right">L. {(item.sell_price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                <span>Total:</span>
                <span>L. {cartTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pago</label>
            <select 
              className="w-full p-2 border rounded-lg bg-white"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex justify-center items-center gap-2 ${cart.length > 0 && !isProcessing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            {isProcessing ? (
               <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : <Printer />}
            {isProcessing ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-fade-in-up">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Venta Registrada</h3>
            <p className="text-gray-500 mb-6">
                Monto: <span className="font-bold text-slate-800">L. {lastSale.total_amount.toFixed(2)}</span>
            </p>
            
            <div className="space-y-3">
                <button
                onClick={() => generateReceipt(lastSale)}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                <Receipt size={20} /> Imprimir Ticket PDF
                </button>
                <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gray-100 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                >
                Nueva Venta
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};