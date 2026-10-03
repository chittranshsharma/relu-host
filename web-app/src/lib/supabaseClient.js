import { createClient } from '@supabase/supabase-js';
import localFinalResults from '../data/finalresults.json';
import localDisneySample from '../data/disney_cruises.json';
import localIngredientsData from '../data/ingredients_network.json';

const STORAGE_KEY_URL = 'relu_supabase_url';
const STORAGE_KEY_ANON = 'relu_supabase_anon_key';

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = storedUrl || envUrl || '';
  const anonKey = storedKey || envKey || '';

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isCustom: !!(storedUrl || storedKey),
    isConfigured: !!(url.trim() && anonKey.trim())
  };
}

export function saveSupabaseCredentials(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  }
}

export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return null;
  }
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false
      }
    });
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function pingSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase credentials are not configured.', latencyMs: 0 };
  }
  const start = performance.now();
  try {
    const { data, error } = await client
      .from('disney_cruises')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // Check if it's just that table does not exist yet
      if (error.code === '42P01') {
        return {
          success: true,
          tableReady: false,
          message: 'Connected to Supabase! Table "disney_cruises" does not exist yet. Run schema.sql in Supabase SQL editor.',
          latencyMs
        };
      }
      return { success: false, message: error.message, latencyMs };
    }

    return {
      success: true,
      tableReady: true,
      count: data?.length || 0,
      message: 'Successfully connected and verified Supabase connection!',
      latencyMs
    };
  } catch (err) {
    return { success: false, message: err.message || 'Connection failed', latencyMs: 0 };
  }
}

export async function fetchDisneyCruisesData() {
  const client = getSupabaseClient();
  if (client) {
    try {
      // First try real finalresults table (171 rows)
      const { data: finalData, error: finalError } = await client
        .from('disney_cruises_final')
        .select('*')
        .order('id', { ascending: true });

      if (!finalError && finalData && finalData.length > 0) {
        return {
          source: 'supabase',
          table: 'disney_cruises_final',
          data: finalData,
          error: null
        };
      }

      // If disney_cruises_final wasn't populated, check legacy sample table
      const { data, error } = await client
        .from('disney_cruises')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return {
          source: 'supabase',
          table: 'disney_cruises',
          data,
          error: null
        };
      }
      if (error) {
        console.warn('Supabase fetch error, falling back to local dataset:', error.message);
      }
    } catch (err) {
      console.warn('Supabase query exception, falling back to local dataset:', err);
    }
  }

  // Graceful fallback to verified scraped dataset (171 real results)
  return {
    source: 'local',
    table: 'finalresults.json',
    data: localFinalResults || localDisneySample,
    error: null
  };
}

export async function fetchIngredientsData() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('ingredients_network')
        .select('*')
        .order('id', { ascending: true })
        .range(0, 2000);

      if (!error && data && data.length > 0) {
        return {
          source: 'supabase',
          data,
          error: null
        };
      }
      if (error) {
        console.warn('Supabase fetch error, falling back to local dataset:', error.message);
      }
    } catch (err) {
      console.warn('Supabase query exception, falling back to local dataset:', err);
    }
  }

  // Graceful fallback to verified scraped dataset
  return {
    source: 'local',
    data: localIngredientsData,
    error: null
  };
}

export async function syncTableToSupabase(tableName, records) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Please supply Supabase Project URL and Anon Key.');
  }

  // Insert or upsert records
  const { data, error } = await client
    .from(tableName)
    .upsert(records, { onConflict: 'id' });

  if (error) {
    throw error;
  }
  return { success: true, count: records.length };
}
