import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Purchases } from './components/Purchases';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { InitialInventoryPage } from './components/InitialInventoryPage';
import { Configuration } from './components/Configuration';
import { seedData } from './services/db';
import { PageView } from './types';
import { Menu } from 'lucide-react';
import { Notification, NotificationType } from './components/Notification';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  useEffect(() => {
    const init = async () => {
        await seedData();
    };
    init();
  }, []);

  const notify = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS notify={notify} />;
      case 'products': return <Inventory notify={notify} />;
      case 'initial_inventory': return <InitialInventoryPage notify={notify} />;
      case 'purchases': return <Purchases notify={notify} />;
      case 'expenses': return <Expenses notify={notify} />;
      case 'reports': return <Reports notify={notify} />;
      case 'configuration': return <Configuration notify={notify} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-20">
        <span className="font-bold">POS Honduras</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu />
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-10 pt-16 p-4">
          <div className="space-y-4">
            <button onClick={() => {setCurrentPage('dashboard'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Dashboard</button>
            <button onClick={() => {setCurrentPage('pos'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Punto de Venta</button>
            <button onClick={() => {setCurrentPage('products'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Productos</button>
            <button onClick={() => {setCurrentPage('initial_inventory'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Inventario Inicial</button>
            <button onClick={() => {setCurrentPage('purchases'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Compras</button>
            <button onClick={() => {setCurrentPage('expenses'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Gastos</button>
            <button onClick={() => {setCurrentPage('reports'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Reportes</button>
            <button onClick={() => {setCurrentPage('configuration'); setIsMobileMenuOpen(false)}} className="block w-full text-left text-white py-2">Configuración</button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;