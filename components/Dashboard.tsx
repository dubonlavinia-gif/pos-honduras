import React, { useEffect, useState } from 'react';
import { getSales, getExpenses, getProducts, getPurchases, getInitialInventory } from '../services/db';
import { Sale, Expense, Product, Purchase, InitialInventory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Wallet, BrainCircuit, FileDown } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [initialInventory, setInitialInv] = useState<InitialInventory | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, e, p, pur, initInv] = await Promise.all([
        getSales(),
        getExpenses(),
        getProducts(),
        getPurchases(),
        getInitialInventory()
      ]);
      setSales(s);
      setExpenses(e);
      setProducts(p);
      setPurchases(pur);
      setInitialInv(initInv);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // --- CÁLCULOS CONTABLES (P&G) ---

  // 1. Ingresos (Ventas)
  const ingresosTotales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

  // 2. Costo de Ventas (COGS) = Inv Inicial + Compras - Inv Final
  const valorInventarioInicial = initialInventory ? Number(initialInventory.total_value) : 0;
  const periodName = initialInventory ? initialInventory.period_name : "Periodo no definido";
  const comprasNetas = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const valorInventarioFinal = products.reduce((sum, p) => sum + (p.stock * Number(p.cost_price)), 0);
  
  const costoDeVentas = (valorInventarioInicial + comprasNetas) - valorInventarioFinal;
  // Nota: Si el costo sale negativo (por falta de registro de inventario inicial), lo mostramos como 0 para no romper la lógica visual, aunque contablemente indica error de registro.
  const costoDeVentasReal = Math.max(0, costoDeVentas); 

  // 3. Utilidad Bruta
  const utilidadBruta = ingresosTotales - costoDeVentasReal;

  // 4. Gastos Operacionales
  const gastosVenta = expenses.filter(e => e.category !== 'ADMIN').reduce((sum, e) => sum + Number(e.amount), 0); // Simplificación
  const gastosAdmin = expenses.filter(e => e.category === 'ADMIN').reduce((sum, e) => sum + Number(e.amount), 0); 
  const totalGastos = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // 5. Utilidad Operacional / Neta (Antes de impuestos simplificada)
  const utilidadNeta = utilidadBruta - totalGastos;

  // --- Charts Data ---
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = new Date(sale.created_at).toLocaleDateString('es-HN');
    acc[date] = (acc[date] || 0) + Number(sale.total_amount);
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    name: date,
    ventas: salesByDate[date]
  })).slice(-7);

  const generateAiInsight = async () => {
    if (!process.env.API_KEY) {
      setAiInsight("Error: Clave API no configurada.");
      return;
    }
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Actúa como contador experto para un taller y venta de repuestos en Honduras.
        Analiza este Estado de Resultados (Moneda HNL):
        
        1. INGRESOS: L. ${ingresosTotales.toFixed(2)}
        2. COSTO DE VENTAS: L. ${costoDeVentasReal.toFixed(2)}
           (Calculado como: Inv. Inicial ${valorInventarioInicial} + Compras ${comprasNetas} - Inv. Final ${valorInventarioFinal})
        3. UTILIDAD BRUTA: L. ${utilidadBruta.toFixed(2)}
        4. GASTOS OPERATIVOS: L. ${totalGastos.toFixed(2)}
        5. UTILIDAD NETA: L. ${utilidadNeta.toFixed(2)}
        
        Dame 3 observaciones financieras breves y una recomendación para mejorar la rentabilidad.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      setAiInsight(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error(error);
      setAiInsight("Error conectando con IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const downloadPdfReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Estado de Resultados (P&G)", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-HN')}`, 105, 28, { align: "center" });
    doc.text(`Periodo Base: ${periodName}`, 105, 33, { align: "center" });
    doc.text(`Moneda: Lempiras (HNL)`, 105, 38, { align: "center" });

    const bodyData = [
      ["INGRESOS POR VENTAS", "", `L. ${ingresosTotales.toFixed(2)}`],
      ["(-) Costo de Ventas", "", `(L. ${costoDeVentasReal.toFixed(2)})`],
      [{content: `  Inv. Inicial (${periodName}): ${valorInventarioInicial.toFixed(2)} | Compras: ${comprasNetas.toFixed(2)} | Inv. Final (Stock Actual): ${valorInventarioFinal.toFixed(2)}`, colSpan: 3, styles: { fontSize: 8, fontStyle: 'italic', textColor: 100 }}],
      ["UTILIDAD BRUTA", "", `L. ${utilidadBruta.toFixed(2)}`],
      ["", "", ""],
      ["GASTOS OPERATIVOS", "", `(L. ${totalGastos.toFixed(2)})`],
      ...expenses.map(e => [`  - ${e.category}: ${e.description}`, `L. ${e.amount.toFixed(2)}`, ""]),
      ["", "", ""],
      ["UTILIDAD NETA", "", `L. ${utilidadNeta.toFixed(2)}`],
    ];

    autoTable(doc, {
      head: [["Concepto", "Detalle", "Total"]],
      body: bodyData as any,
      startY: 45,
      theme: 'plain',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 100 },
        2: { fontStyle: 'bold', halign: 'right' }
      }
    });

    doc.save("estado_de_resultados.pdf");
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estado de Resultados</h1>
          <p className="text-sm text-gray-500">Análisis de rentabilidad (Ingresos - Costos - Gastos)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadPdfReport}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <FileDown size={16} /> Reporte P&G PDF
          </button>
        </div>
      </div>

      {/* Financial Statement Card (P&L Structure) */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h2 className="font-bold text-lg">Resumen Financiero</h2>
            <span className="text-sm opacity-75">Base: {periodName}</span>
        </div>
        <div className="p-6 grid gap-4">
            
            {/* 1. Ingresos */}
            <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded text-green-600"><TrendingUp size={20}/></div>
                    <div>
                        <p className="font-bold text-slate-700">Ingresos por Ventas</p>
                        <p className="text-xs text-gray-500">Facturación total bruta</p>
                    </div>
                </div>
                <p className="text-xl font-bold text-slate-800">L. {ingresosTotales.toFixed(2)}</p>
            </div>

            {/* 2. Costo de Ventas */}
            <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded text-orange-600"><Wallet size={20}/></div>
                    <div>
                        <p className="font-bold text-slate-700">(-) Costo de Ventas (COGS)</p>
                        <p className="text-xs text-gray-500">Formula: Inv. Inicial + Compras - Inv. Final</p>
                        <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-1 rounded inline-block">
                            II: {valorInventarioInicial.toFixed(0)} + C: {comprasNetas.toFixed(0)} - IF: {valorInventarioFinal.toFixed(0)}
                        </div>
                    </div>
                </div>
                <p className="text-xl font-bold text-red-500">(L. {costoDeVentasReal.toFixed(2)})</p>
            </div>

            {/* 3. Utilidad Bruta */}
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                <p className="font-bold text-blue-800">(=) UTILIDAD BRUTA</p>
                <p className="text-xl font-bold text-blue-800">L. {utilidadBruta.toFixed(2)}</p>
            </div>

            {/* 4. Gastos */}
            <div className="flex justify-between items-center border-b pb-2 pt-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded text-red-600"><DollarSign size={20}/></div>
                    <div>
                        <p className="font-bold text-slate-700">(-) Gastos Operativos</p>
                        <p className="text-xs text-gray-500">Servicios, Planilla, Alquiler, etc.</p>
                    </div>
                </div>
                <p className="text-xl font-bold text-red-500">(L. {totalGastos.toFixed(2)})</p>
            </div>

             {/* 5. Utilidad Neta */}
             <div className={`flex justify-between items-center p-4 rounded-lg shadow-inner ${utilidadNeta >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                <div>
                    <p className="font-extrabold text-lg">(=) UTILIDAD NETA</p>
                    <p className="text-xs opacity-75">Antes de Impuestos</p>
                </div>
                <p className="text-3xl font-extrabold">L. {utilidadNeta.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Tendencia de Ventas</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`L. ${value}`, 'Ventas']} />
                <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="text-purple-600" />
            <h2 className="text-lg font-bold text-slate-800">Consultor IA</h2>
          </div>
          <div className="flex-1 bg-gray-50 rounded p-4 text-sm text-gray-700 overflow-y-auto max-h-64">
            {loadingAi ? (
              <div className="flex items-center justify-center h-full gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Analizando P&G...</span>
              </div>
            ) : aiInsight ? (
              <div className="prose prose-sm whitespace-pre-wrap">{aiInsight}</div>
            ) : (
              <div className="text-center text-gray-400 mt-4">
                <p>Genera un análisis financiero basado en tus resultados actuales.</p>
              </div>
            )}
          </div>
          <button 
            onClick={generateAiInsight}
            disabled={loadingAi}
            className="mt-4 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors disabled:bg-gray-300"
          >
            {loadingAi ? 'Generando...' : 'Analizar Rentabilidad'}
          </button>
        </div>
      </div>
    </div>
  );
};