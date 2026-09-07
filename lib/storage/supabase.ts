import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side
export function createClientBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server-side
export function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase Admin Client not configured correctly");
  }
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}

/**
 * Get the public URL for an object in the given bucket
 */
export function getPublicUrl(bucket: string, objectPath: string): string {
  // Use generic generic fallback to generate the url, or create plain client
  const fallbackClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = fallbackClient.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
