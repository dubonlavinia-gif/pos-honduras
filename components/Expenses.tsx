import React, { useState, useEffect } from 'react';
import { createExpense, getExpenses } from '../services/db';
import { Expense } from '../types';
import { DollarSign, Save } from 'lucide-react';

interface ExpensesProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ notify }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'SERVICIOS'
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense(formData);
      await loadExpenses();
      setFormData({ description: '', amount: 0, category: 'SERVICIOS' });
      notify("Gasto registrado correctamente", "success");
    } catch (error) {
      console.error(error);
      notify('Error al guardar gasto', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Gastos Operativos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Registrar Nuevo Gasto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input 
                required
                type="text" 
                placeholder="Ej. Pago de Luz"
                className="mt-1 w-full border rounded p-2"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto (L.)</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                className="mt-1 w-full border rounded p-2"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select 
                className="mt-1 w-full border rounded p-2"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="SERVICIOS">Servicios (Luz, Agua, Internet)</option>
                <option value="ALQUILER">Alquiler</option>
                <option value="PLANILLA">Planilla / Sueldos</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2 disabled:bg-red-300"
            >
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-bold mb-4">Historial de Gastos</h2>
          <div className="overflow-y-auto h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.created_at).toLocaleDateString('es-HN')}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{expense.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                      L. {expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};