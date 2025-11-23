import { createClient } from '@supabase/supabase-js';

// Esto busca las llaves en la configuración de Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación de seguridad
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('¡Faltan las llaves! Revisa las Variables de Entorno en Vercel.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');