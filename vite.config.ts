import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo actual
  // El tercer parámetro '' carga todas las variables sin filtrar por prefijo VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Mapea GEMINI_API_KEY (del .env) a process.env.API_KEY para el SDK @google/genai
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      
      // Aseguramos que las variables de Supabase estén disponibles globalmente si fallan otras cargas
      // pero priorizando las del archivo .env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  };
});