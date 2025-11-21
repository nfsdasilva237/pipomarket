// config/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vrdzdtdpdioblxlnjqce.supabase.co'; // ← TON URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZHpkdGRwZGlvYmx4bG5qcWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODYzMTEsImV4cCI6MjA3OTA2MjMxMX0.TeNf5Sqj7JDc4M1XYeoNMy9IFVKrd0Y8djVnnRkmC2A'; // ← TA CLÉ

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Exposer l'URL et la clé pour l'upload
supabase.storageUrl = `${SUPABASE_URL}/storage/v1`;
supabase.supabaseKey = SUPABASE_ANON_KEY;