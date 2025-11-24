import { createClient } from '@supabase/supabase-js';

// Credenciales directas para asegurar que funcione en cualquier entorno
const SUPABASE_URL = "https://jtfwjbipjyzywrnlwsnf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZndqYmlwanl6eXdybmx3c25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0MTcsImV4cCI6MjA3OTA4OTQxN30.nZCWVKecT_HHzQN1b7syXuNzErkrvFHKyT8YR802cDo";

// Helper para leer variables de entorno de manera segura
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore: Evita errores de tipo si env no está en import.meta
    return (import.meta.env && import.meta.env[key]) ? import.meta.env[key] : fallback;
  } catch (e) {
    return fallback;
  }
};

// Priorizamos la variable de entorno si existe, sino usamos la hardcoded
const supabaseUrl = getEnv('VITE_SUPABASE_URL', SUPABASE_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);