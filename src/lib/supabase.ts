import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Strip literal quotes that Railway or users might inject accidentally
const supabaseUrl = rawSupabaseUrl.replace(/^["']|["']$/g, '');
const supabaseAnonKey = rawSupabaseAnonKey.replace(/^["']|["']$/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis do Supabase não encontradas. Verifique seu arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com privilégios de administrador (usado apenas em Server Actions/API)
// Nunca exporte o serviceRole para o client-side (navegador)
export function getServiceSupabase() {
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const serviceKey = rawServiceKey.replace(/^["']|["']$/g, '');
  
  if (!serviceKey) {
    throw new Error("Chave secreta (Service Role) não encontrada");
  }
  return createClient(supabaseUrl, serviceKey);
}
