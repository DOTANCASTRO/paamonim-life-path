import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Anon client — used client-side (subject to RLS)
let _anonClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    try { new URL(url); } catch {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}". Must be https://your-project.supabase.co`);
    }
    _anonClient = createClient(url, key);
  }
  return _anonClient;
}

// Service role client — server-side only, bypasses RLS.
// Safe because all callers are API routes that already validate auth.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY as NEXT_PUBLIC_.
let _serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!_serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    _serviceClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _serviceClient;
}
