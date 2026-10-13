export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  appName: import.meta.env.VITE_APP_NAME,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};