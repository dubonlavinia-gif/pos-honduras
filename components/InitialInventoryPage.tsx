import React, { useEffect, useState } from 'react';
import { getInitialInventoryHistory, setInitialInventory } from '../services/db';
import { InitialInventory } from '../types';
import { Save, CheckCircle } from 'lucide-react';

interface InitialInventoryPageProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const InitialInventoryPage: React.FC<InitialInventoryPageProps> = ({ notify }) => {
  const [history, setHistory] = useState<InitialInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    periodName: '',
    totalValue: ''
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getInitialInventoryHistory();
    setHistory(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.periodName || !formData.totalValue) return;

    setLoading(true);
    try {
      await setInitialInventory(parseFloat(formData.totalValue), formData.periodName);
      setFormData({ periodName: '', totalValue: '' });
      await loadHistory();
      notify("Inventario inicial establecido con éxito para el nuevo periodo.", "success");
    } catch (error) {
      console.error(error);
      notify("Error al guardar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Inventario Inicial (Contable)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-lg font-bold mb-2 text-slate-700">Nuevo Periodo</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
                Establece el valor monetario total con el que inicia el inventario para un periodo contable. 
                Este valor se usa para calcular el <strong>Costo de Ventas</strong> en el reporte de P&G.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Periodo</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ej. Octubre 2024"
                        className="w-full border rounded p-2 mt-1"
                        value={formData.periodName}
                        onChange={e => setFormData({...formData, periodName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Total Inventario (L.)</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full border rounded p-2 mt-1"
                        value={formData.totalValue}
                        onChange={e => setFormData({...formData, totalValue: e.target.value})}
                    />
                </div>
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                    <Save size={16} /> {loading ? 'Guardando...' : 'Establecer Periodo'}
                </button>
            </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Historial de Periodos</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Periodo</th>
                            <th className="px-4 py-3">Valor Inicial</th>
                            <th className="px-4 py-3">Fecha Creación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    No hay registros de inventario inicial.
                                </td>
                            </tr>
                        ) : (
                            history.map((item) => (
                                <tr key={item.id} className={item.is_active ? "bg-blue-50" : ""}>
                                    <td className="px-4 py-3">
                                        {item.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">
                                                <CheckCircle size={12} /> ACTIVO
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium">{item.period_name}</td>
                                    <td className="px-4 py-3 font-bold text-slate-700">L. {item.total_value.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString('es-HN')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};