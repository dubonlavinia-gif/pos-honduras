import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo actual
  const env = loadEnv(mode, '.', '');

  // Credenciales de Supabase (Hardcoded para despliegue directo sin config en Vercel)
  const SUPABASE_URL = "https://jtfwjbipjyzywrnlwsnf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZndqYmlwanl6eXdybmx3c25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0MTcsImV4cCI6MjA3OTA4OTQxN30.nZCWVKecT_HHzQN1b7syXuNzErkrvFHKyT8YR802cDo";

  return {
    plugins: [react()],
    define: {
      // Mapea GEMINI_API_KEY (del .env) a process.env.API_KEY para el SDK @google/genai
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      
      // Inyectamos las credenciales de Supabase directamente en el build
      // Esto permite que funcione en Vercel sin configurar variables de entorno en el dashboard
      'process.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
      
      // También definimos las versiones estándar de import.meta.env para compatibilidad
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
    }
  };
});