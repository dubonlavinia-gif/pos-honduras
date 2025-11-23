import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines env vars so they are available in the built app on Vercel without extra config
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://Jtfwjbipjyzywrnlwsnf.supabase.co"),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZndqYmlwanl6eXdybmx3c25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0MTcsImV4cCI6MjA3OTA4OTQxN30.nZCWVKecT_HHzQN1b7syXuNzErkrvFHKyT8YR802cDo"),
  }
});