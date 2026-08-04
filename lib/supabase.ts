import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Client modules are evaluated while Next.js prerenders pages during the build.
// Use harmless placeholders only for that server-side build pass so a missing
// public variable does not crash the entire deployment. In the browser, Vercel's
// NEXT_PUBLIC_* values are embedded in the bundle and used normally.
const buildSafeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const buildSafeKey = supabaseKey || 'placeholder-key'

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.error(
    'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient(buildSafeUrl, buildSafeKey)
