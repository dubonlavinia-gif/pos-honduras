import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, TrendingDown, Truck, LogOut, Archive, FileText, Settings } from 'lucide-react';
import { PageView } from '../types';

interface SidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const menuItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'pos', label: 'Punto de Venta', icon: <ShoppingCart size={20} /> },
    { id: 'products', label: 'Productos (Stock)', icon: <Package size={20} /> },
    { id: 'initial_inventory', label: 'Inventario Inicial', icon: <Archive size={20} /> },
    { id: 'purchases', label: 'Compras', icon: <Truck size={20} /> },
    { id: 'expenses', label: 'Gastos', icon: <TrendingDown size={20} /> },
    { id: 'reports', label: 'Reportes', icon: <FileText size={20} /> },
    { id: 'configuration', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          POS Honduras
        </h1>
        <p className="text-xs text-slate-400 mt-1">Gestión Comercial</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
};