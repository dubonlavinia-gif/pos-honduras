
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  cost_price: number; // Costo promedio ponderado
  sell_price: number;
  stock: number;
  min_stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  items: SaleItem[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number; // Snapshot of cost at time of sale
}

export interface Purchase {
  id: string;
  created_at: string;
  supplier_name: string;
  total_amount: number;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface Expense {
  id: string;
  created_at: string;
  description: string;
  category: string;
  amount: number;
}

export interface InitialInventory {
  id: string;
  created_at: string;
  period_name: string;
  total_value: number;
  is_active: boolean;
}

export type PageView = 'dashboard' | 'pos' | 'products' | 'purchases' | 'expenses' | 'initial_inventory' | 'reports' | 'configuration';