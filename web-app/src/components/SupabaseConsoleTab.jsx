import React, { useState } from 'react';
import { 
  Database, ShieldCheck, Check, Copy, ExternalLink, RefreshCw, 
  UploadCloud, AlertCircle, Key, Globe, Terminal, Sparkles, Layers, ArrowUpRight 
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
    <div className="section-container">
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-info">
          <h2>
            <Database size={24} style={{ color: 'var(--accent-cyan)' }} />
            Supabase Cloud Persistence Engine
          </h2>
          <p>
            Seamless real-time synchronization between the web scraper pipelines, relational Supabase PostgreSQL tables,
            and the interactive client presentation layer.
          </p>
          <div className="hero-meta-badges">
            <span className="meta-badge highlight">
              <Sparkles size={12} /> Bonus Challenge
            </span>
            <span className="meta-badge">
              Status: <strong>{supabaseStatus?.connected ? 'Connected to Cloud' : 'Ready (Local Cache Active)'}</strong>
            </span>
            <span className="meta-badge">
              Latency: {supabaseStatus?.latencyMs || 0}ms
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <span>Supabase Console</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>

      {/* Grid: Credentials & Status on Left, Schema & Sync on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Connection Manager */}
          <div className="qa-card">
            <div className="qa-card-header">
              <h3>
                <Key size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>Cloud Credentials Configuration</span>
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Public API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save & Connect
                </button>
                <button className="btn btn-secondary" onClick={handleTestConnection} disabled={isTesting}>
                  <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {currentCreds.isCustom && (
                <button className="btn btn-ghost" onClick={handleClear} style={{ color: 'var(--accent-rose)' }}>
                  Clear Custom Keys
                </button>
              )}
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  color: testResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              >
                {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                <div style={{ flex: 1 }}>
                  <strong>{testResult.success ? 'Connected' : 'Connection Failed'}:</strong>{' '}
                  {testResult.message}
                  {testResult.latencyMs > 0 && (
                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                      ({testResult.latencyMs}ms)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card: Table Status Overview */}
          <div className="qa-card">
            <div className="qa-card-header">
              <h3>
                <Layers size={18} style={{ color: 'var(--accent-indigo)' }} />
                <span>Persistent Table States</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="question-item">
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>public.disney_cruises</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Active data source: {sourceDisney === 'supabase' ? 'Supabase Table' : 'Local verified fallback'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-cyan">{disneyData.length} rows</span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '11px' }}
                    onClick={handleSyncDisney}
                    disabled={isSyncingDisney}
                  >
                    <UploadCloud size={13} /> {isSyncingDisney ? 'Pushing...' : 'Push to DB'}
                  </button>
                </div>
              </div>

              <div className="question-item">
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>public.ingredients_network</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Active data source: {sourceIng === 'supabase' ? 'Supabase Table' : 'Local verified fallback'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-emerald">{ingredientsData.length} rows</span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '11px' }}
                    onClick={handleSyncIngredients}
                    disabled={isSyncingIng}
                  >
                    <UploadCloud size={13} /> {isSyncingIng ? 'Pushing...' : 'Push to DB'}
                  </button>
                </div>
              </div>
            </div>

            {syncMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  background: syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: syncMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
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
              <Terminal size={18} style={{ color: 'var(--accent-emerald)' }} />
              <span>Supabase SQL DDL Schema</span>
            </h3>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleCopySql}>
              {copiedSql ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Execute this SQL script directly in your <strong>Supabase SQL Editor</strong> to create the tables,
            indexes, and Row-Level-Security (RLS) policies.
          </p>

          <pre className="code-snippet" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {schemaSql}
          </pre>
        </div>
      </div>
    </div>
  );
}
