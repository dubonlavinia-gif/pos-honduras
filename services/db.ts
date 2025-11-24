
import { supabase } from '../supabaseClient';
import { Product, Sale, Purchase, Expense, InitialInventory } from '../types';

// --- Helpers ---

const mapSaleData = (data: any[]): Sale[] => {
  return data.map((sale) => ({
    ...sale,
    items: sale.sale_items.map((item: any) => ({
      ...item,
      product_name: item.products?.name || 'Producto Desconocido',
    })),
  }));
};

const mapPurchaseData = (data: any[]): Purchase[] => {
  return data.map((purchase) => ({
    ...purchase,
    items: purchase.purchase_items.map((item: any) => ({
      ...item,
      product_name: item.products?.name || 'Producto Desconocido',
    })),
  }));
};

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }
  return data as Product[];
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }) => {
  if (product.id) {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        cost_price: product.cost_price,
        sell_price: product.sell_price,
        stock: product.stock,
        min_stock: product.min_stock
      })
      .eq('id', product.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        cost_price: product.cost_price,
        sell_price: product.sell_price,
        stock: product.stock,
        min_stock: product.min_stock
      }]);
    if (error) throw error;
  }
};

export const updateProductStockAndCost = async (id: string, quantityToAdd: number, newUnitCost: number) => {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !product) {
    console.error("Product not found for stock update", fetchError);
    return;
  }

  const currentStock = product.stock;
  const currentCost = product.cost_price;
  
  const currentValue = currentStock * currentCost;
  const newValue = quantityToAdd * newUnitCost;
  const totalStock = currentStock + quantityToAdd;
  
  let weightedCost = currentCost;
  if (totalStock > 0) {
    weightedCost = (currentValue + newValue) / totalStock;
  }

  await supabase
    .from('products')
    .update({
      stock: totalStock,
      cost_price: parseFloat(weightedCost.toFixed(2))
    })
    .eq('id', id);
};

// --- Sales ---

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error.message);
    return [];
  }

  return mapSaleData(data);
};

export const createSale = async (saleData: Omit<Sale, 'id' | 'created_at'>): Promise<Sale | null> => {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      total_amount: saleData.total_amount,
      payment_method: saleData.payment_method
    }])
    .select()
    .single();

  if (saleError || !sale) {
    console.error("Error creating sale header:", saleError);
    throw saleError;
  }

  const itemsToInsert = saleData.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    unit_cost: item.unit_cost
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  for (const item of saleData.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();
    
    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
    }
  }

  return { ...sale, items: saleData.items };
};

// --- Purchases ---

export const getPurchases = async (): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      purchase_items (
        *,
        products (name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchases:', error.message);
    return [];
  }
  return mapPurchaseData(data);
};

export const createPurchase = async (purchaseData: Omit<Purchase, 'id' | 'created_at'>) => {
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([{
      supplier_name: purchaseData.supplier_name,
      total_amount: purchaseData.total_amount
    }])
    .select()
    .single();

  if (purchaseError || !purchase) throw purchaseError;

  const itemsToInsert = purchaseData.items.map(item => ({
    purchase_id: purchase.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost
  }));

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(itemsToInsert);
  
  if (itemsError) throw itemsError;

  for (const item of purchaseData.items) {
    await updateProductStockAndCost(item.product_id, item.quantity, item.unit_cost);
  }

  return purchase;
};

// --- Expenses ---

export const getExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error.message);
    return [];
  }
  return data as Expense[];
};

export const createExpense = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expenseData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- Initial Inventory (P&L Logic) ---

export const getInitialInventory = async (): Promise<InitialInventory | null> => {
  // Returns the currently ACTIVE initial inventory for calculation
  const { data, error } = await supabase
    .from('initial_inventory')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.warn('Warning: Could not fetch active initial inventory.', error.message);
    return null;
  }
  return data as InitialInventory;
};

export const getInitialInventoryHistory = async (): Promise<InitialInventory[]> => {
  const { data, error } = await supabase
    .from('initial_inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory history:', error.message);
    return [];
  }
  return data as InitialInventory[];
};

export const setInitialInventory = async (value: number, periodName: string) => {
  // Deactivate all currently active records
  const { error: updateError } = await supabase
    .from('initial_inventory')
    .update({ is_active: false })
    .eq('is_active', true);
  
  if (updateError) {
    console.error("Error deactivating old inventory records:", updateError.message);
  }

  const { data, error } = await supabase
    .from('initial_inventory')
    .insert([{ total_value: value, period_name: periodName, is_active: true }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// --- Seed ---

export const seedData = async () => {
    const products = await getProducts();
    if (products.length === 0) {
        console.log("Seeding initial data...");
        // Updated to use OFFICIAL CATEGORIES
        const initialProducts = [
            { name: 'Tajo de Res', sku: 'CAR-0001', category: 'Carnes', cost_price: 80.00, sell_price: 120.00, stock: 15, min_stock: 5 },
            { name: 'Leche Entera', sku: 'LAC-0001', category: 'Lácteos', cost_price: 25.00, sell_price: 32.00, stock: 50, min_stock: 10 },
            { name: 'Pan Molde Blanco', sku: 'PAN-0001', category: 'Panadería', cost_price: 35.00, sell_price: 50.00, stock: 20, min_stock: 5 },
            { name: 'Refresco Cola 3L', sku: 'BEB-0001', category: 'Agua y Refrescos', cost_price: 45.00, sell_price: 60.00, stock: 30, min_stock: 8 },
            { name: 'Jabón de Baño', sku: 'PER-0001', category: 'Higiene Personal', cost_price: 15.00, sell_price: 25.00, stock: 40, min_stock: 10 },
        ];
        
        const { error } = await supabase.from('products').insert(initialProducts);
        if (error) console.error("Error seeding data", error.message);
    }
};
