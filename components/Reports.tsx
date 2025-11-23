import React, { useEffect, useState } from 'react';
import { getSales, getExpenses, getPurchases } from '../services/db';
import { Sale, Expense, Purchase } from '../types';
import { FileDown, Calendar, DollarSign, ShoppingBag, Truck } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportsProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Reports: React.FC<ReportsProps> = ({ notify }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'expenses'>('sales');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, e, p] = await Promise.all([getSales(), getExpenses(), getPurchases()]);
      setSales(s);
      setExpenses(e);
      setPurchases(p);
    } catch (error) {
      notify("Error cargando datos de reportes", "error");
    }
  };

  const exportPDF = (title: string, headers: string[], data: any[]) => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 26);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 30,
    });

    doc.save(`${title.toLowerCase().replace(/\s/g, '_')}.pdf`);
    notify("Reporte descargado correctamente", "success");
  };

  const handleExportSales = () => {
    const data = sales.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      s.id.slice(0, 8),
      s.payment_method,
      `L. ${s.total_amount.toFixed(2)}`
    ]);
    exportPDF("Reporte de Ventas", ["Fecha", "ID Venta", "Método Pago", "Total"], data);
  };

  const handleExportPurchases = () => {
    const data = purchases.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      p.supplier_name,
      p.items.length,
      `L. ${p.total_amount.toFixed(2)}`
    ]);
    exportPDF("Reporte de Compras", ["Fecha", "Proveedor", "Items", "Total"], data);
  };

  const handleExportExpenses = () => {
    const data = expenses.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      e.description,
      e.category,
      `L. ${e.amount.toFixed(2)}`
    ]);
    exportPDF("Reporte de Gastos", ["Fecha", "Descripción", "Categoría", "Monto"], data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Reportes Generales</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2 px-4 flex items-center gap-2 ${activeTab === 'sales' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
        >
          <ShoppingBag size={18} /> Ventas
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-2 px-4 flex items-center gap-2 ${activeTab === 'purchases' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
        >
          <Truck size={18} /> Compras
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2 px-4 flex items-center gap-2 ${activeTab === 'expenses' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
        >
          <DollarSign size={18} /> Gastos
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === 'sales' && (
          <div>
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-bold text-gray-700">Historial de Ventas ({sales.length})</span>
              <button onClick={handleExportSales} className="flex items-center gap-2 text-sm bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700">
                <FileDown size={16} /> Exportar PDF
              </button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Pago</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(sale.created_at).toLocaleDateString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">{sale.id.slice(0,8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">{sale.payment_method}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">L. {sale.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-bold text-gray-700">Historial de Compras ({purchases.length})</span>
              <button onClick={handleExportPurchases} className="flex items-center gap-2 text-sm bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700">
                <FileDown size={16} /> Exportar PDF
              </button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Proveedor</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(purchase.created_at).toLocaleDateString('es-HN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{purchase.supplier_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{purchase.items.length}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">L. {purchase.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-bold text-gray-700">Historial de Gastos ({expenses.length})</span>
              <button onClick={handleExportExpenses} className="flex items-center gap-2 text-sm bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700">
                <FileDown size={16} /> Exportar PDF
              </button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(expense.created_at).toLocaleDateString('es-HN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">{expense.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">L. {expense.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};