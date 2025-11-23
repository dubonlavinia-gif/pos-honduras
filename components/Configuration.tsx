import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

interface ConfigurationProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({ notify }) => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'POS Honduras',
    address: 'Tegucigalpa, Honduras',
    phone: '+504 9999-9999',
    rtn: '0801-1990-123456'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyInfo({
      ...companyInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save to a 'settings' table in Supabase in a real app.
    // For now we just simulate it.
    notify("Configuración guardada correctamente", "success");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings className="text-slate-800" /> Configuración del Sistema
      </h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Información de la Empresa</h2>
        <p className="text-sm text-gray-500 mb-6">
          Estos datos aparecerán en los encabezados de los reportes y tickets de venta.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
            <input 
              type="text" 
              name="name"
              className="mt-1 w-full border rounded p-2"
              value={companyInfo.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">RTN / ID Fiscal</label>
            <input 
              type="text" 
              name="rtn"
              className="mt-1 w-full border rounded p-2"
              value={companyInfo.rtn}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input 
              type="text" 
              name="address"
              className="mt-1 w-full border rounded p-2"
              value={companyInfo.address}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input 
              type="text" 
              name="phone"
              className="mt-1 w-full border rounded p-2"
              value={companyInfo.phone}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4">
             <button 
              type="submit"
              className="bg-slate-900 text-white px-6 py-2 rounded hover:bg-slate-800 flex items-center gap-2"
            >
              <Save size={18} /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Configuración Regional</h2>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Moneda</label>
                <input type="text" disabled value="Lempira (HNL)" className="mt-1 w-full border rounded p-2 bg-gray-100 text-gray-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Impuesto (ISV)</label>
                <input type="text" disabled value="15%" className="mt-1 w-full border rounded p-2 bg-gray-100 text-gray-500" />
            </div>
        </div>
      </div>
    </div>
  );
};