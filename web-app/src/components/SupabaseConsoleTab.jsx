import React, { useState } from 'react';
import { 
  Database, Check, Copy, RefreshCw, 
  UploadCloud, AlertCircle, Key, Layers, ArrowUpRight, Terminal, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getSupabaseCredentials, saveSupabaseCredentials, pingSupabase, syncTableToSupabase 
} from '../lib/supabaseClient';

export default function SupabaseConsoleTab({ 
  supabaseStatus, onRefreshStatus, disneyData, ingredientsData, sourceDisney, sourceIng 
}) {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingDisney, setIsSyncingDisney] = useState(false);
  const [isSyncingIng, setIsSyncingIng] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = async () => {
    saveSupabaseCredentials(url, anonKey);
    onRefreshStatus();
    handleTestConnection();
  };

  const handleClear = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onRefreshStatus();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await pingSupabase();
      setTestResult(res);
      onRefreshStatus();
      if (res.success) {
        confetti({ particleCount: 35, spread: 60 });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message, latencyMs: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncDisney = async () => {
    setIsSyncingDisney(true);
    setSyncMessage(null);
    try {
      await syncTableToSupabase('disney_cruises', disneyData);
      setSyncMessage({ type: 'success', text: `Successfully synced ${disneyData.length} records into 'disney_cruises' table!` });
      confetti({ particleCount: 50, spread: 70 });
    } catch (err) {
      setSyncMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    } finally {
      setIsSyncingDisney(false);
    }
  };

  const handleSyncIngredients = async () => {
    setIsSyncingIng(true);
    setSyncMessage(null);
    try {
      await syncTableToSupabase('ingredients_network', ingredientsData);
      setSyncMessage({ type: 'success', text: `Successfully synced ${ingredientsData.length} suppliers into 'ingredients_network' table!` });
      confetti({ particleCount: 50, spread: 70 });
    } catch (err) {
      setSyncMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    } finally {
      setIsSyncingIng(false);
    }
  };

  const schemaSql = `-- PostgreSQL / Supabase Migration
CREATE TABLE IF NOT EXISTS public.disney_cruises (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ship TEXT NOT NULL,
  departing_from TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration TEXT NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  itinerary TEXT NOT NULL,
  date_range TEXT NOT NULL,
  weekday_range TEXT,
  interior_price NUMERIC(10, 2),
  oceanview_price NUMERIC(10, 2),
  balcony_price NUMERIC(10, 2),
  suite_price NUMERIC(10, 2),
  available_dates_count INTEGER NOT NULL DEFAULT 1,
  is_holiday_cruise BOOLEAN NOT NULL DEFAULT FALSE,
  holiday_theme TEXT DEFAULT 'None',
  booking_url TEXT,
  bonuses TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ingredients_network (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_description TEXT NOT NULL,
  sales_markets TEXT NOT NULL,
  primary_business_activity TEXT NOT NULL,
  categories TEXT NOT NULL,
  events TEXT,
  address TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  website TEXT,
  has_herbs_and_spices BOOLEAN NOT NULL DEFAULT FALSE,
  has_physical_delivery_formats BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_formats TEXT,
  in_cognitive_mental_health BOOLEAN NOT NULL DEFAULT FALSE,
  health_wellness_focus TEXT,
  ingredients_count INTEGER NOT NULL DEFAULT 0,
  finished_products_count INTEGER NOT NULL DEFAULT 0,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.disney_cruises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read disney" ON public.disney_cruises FOR SELECT USING (true);
CREATE POLICY "Allow public insert disney" ON public.disney_cruises FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read ingredients" ON public.ingredients_network FOR SELECT USING (true);
CREATE POLICY "Allow public insert ingredients" ON public.ingredients_network FOR INSERT WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div>
      {/* Deep Indigo Hero Band */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Supabase Cloud Persistence Engine</h2>
            <p>
              Direct live connection to PostgreSQL tables, Row-Level Security policies, and bidirectional
              synchronization between client-side caches and Supabase cloud.
            </p>
            <div className="hero-stickers-row">
              <span className="sticker-tag sky">
                <Sparkles size={12} /> Bonus Challenge
              </span>
              <span className="sticker-tag green">
                Status: {supabaseStatus?.connected ? 'Connected to Cloud' : 'Ready (Local Cache Active)'}
              </span>
              <span className="sticker-tag purple">
                Latency: {supabaseStatus?.latencyMs || 0}ms
              </span>
            </div>
          </div>

          <div className="hero-actions">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="button-secondary"
            >
              <span>Supabase Console</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Credentials Manager */}
          <div className="qa-card">
            <div className="qa-card-header">
              <h3>
                <Key size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
                <span>Supabase Credentials</span>
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Project URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Anon Public Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="button-primary" onClick={handleSave}>
                  Save & Connect
                </button>
                <button className="button-utility" onClick={handleTestConnection} disabled={isTesting}>
                  <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Testing...' : 'Test Ping'}
                </button>
              </div>

              {currentCreds.isCustom && (
                <button className="button-utility" onClick={handleClear} style={{ color: 'var(--accent-orange)' }}>
                  Clear Custom
                </button>
              )}
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--rounded-xs)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: testResult.success ? '#e7f8eb' : '#ffedf8',
                  border: `1px solid ${testResult.success ? '#bceec6' : '#ffc2eb'}`,
                  color: testResult.success ? '#0d6e22' : '#b30074'
                }}
              >
                {testResult.success ? <Check size={15} /> : <AlertCircle size={15} />}
                <div style={{ flex: 1 }}>
                  <strong>{testResult.success ? 'Connected' : 'Error'}:</strong>{' '}
                  {testResult.message}
                  {testResult.latencyMs > 0 && (
                    <span style={{ marginLeft: '6px', color: 'var(--ink-muted)' }}>
                      ({testResult.latencyMs}ms)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Table States */}
          <div className="qa-card">
            <div className="qa-card-header">
              <h3>
                <Layers size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
                <span>Persistent Table States</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="qa-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>public.disney_cruises</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Active: {sourceDisney === 'supabase' ? 'Supabase Cloud Table' : 'Local Cache'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-pill sky">{disneyData.length} rows</span>
                  <button
                    className="button-utility"
                    onClick={handleSyncDisney}
                    disabled={isSyncingDisney}
                  >
                    <UploadCloud size={13} /> {isSyncingDisney ? 'Pushing...' : 'Sync'}
                  </button>
                </div>
              </div>

              <div className="qa-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>public.ingredients_network</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Active: {sourceIng === 'supabase' ? 'Supabase Cloud Table' : 'Local Cache'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-pill green">{ingredientsData.length} rows</span>
                  <button
                    className="button-utility"
                    onClick={handleSyncIngredients}
                    disabled={isSyncingIng}
                  >
                    <UploadCloud size={13} /> {isSyncingIng ? 'Pushing...' : 'Sync'}
                  </button>
                </div>
              </div>
            </div>

            {syncMessage && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--rounded-xs)',
                  fontSize: '13px',
                  background: syncMessage.type === 'success' ? '#e7f8eb' : '#ffedf8',
                  color: syncMessage.type === 'success' ? '#0d6e22' : '#b30074',
                  border: `1px solid ${syncMessage.type === 'success' ? '#bceec6' : '#ffc2eb'}`
                }}
              >
                {syncMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SQL Schema */}
        <div className="qa-card">
          <div className="qa-card-header">
            <h3>
              <Terminal size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
              <span>Postgres DDL Schema</span>
            </h3>
            <button className="button-utility" onClick={handleCopySql}>
              {copiedSql ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedSql ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '8px' }}>
            Execute this schema in your <strong>Supabase SQL Editor</strong> to initialize tables,
            indexes, and Row-Level Security policies.
          </p>

          <pre className="code-box" style={{ maxHeight: '380px' }}>
            {schemaSql}
          </pre>
        </div>
      </div>
    </div>
  );
}
