import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as FALLBACK_URL, SUPABASE_ANON_KEY as FALLBACK_KEY } from './api_keys/keys';

// Resolve TypeScript error: Property 'env' does not exist on type 'ImportMeta'
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('--------------------------------------------------------------------------------');
  console.error('ERROR CRÍTICO: Faltan variables de entorno de Supabase.');
  console.error('Asegúrate de tener el archivo .env.local con:');
  console.error('VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.error('O configúralas en el panel de despliegue (Vercel/Netlify).');
  console.error('--------------------------------------------------------------------------------');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');