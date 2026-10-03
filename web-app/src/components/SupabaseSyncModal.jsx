import React, { useState } from 'react';
import { 
  Database, Check, Copy, ExternalLink, RefreshCw, 
  UploadCloud, AlertCircle, X, Key, Globe, Terminal 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getSupabaseCredentials, saveSupabaseCredentials, pingSupabase, syncTableToSupabase 
} from '../lib/supabaseClient';

export default function SupabaseSyncModal({ isOpen, onClose, onRefreshStatus, disneyData, ingredientsData }) {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingDisney, setIsSyncingDisney] = useState(false);
  const [isSyncingIng, setIsSyncingIng] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

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
  image_url TEXT
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
  logo_url TEXT
);

ALTER TABLE public.disney_cruises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_disney" ON public.disney_cruises FOR SELECT USING (true);
CREATE POLICY "public_insert_disney" ON public.disney_cruises FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_ingredients" ON public.ingredients_network FOR SELECT USING (true);
CREATE POLICY "public_insert_ingredients" ON public.ingredients_network FOR INSERT WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>
              Supabase Configuration
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
              Configure your remote Supabase credentials or push local records.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div style={{ background: 'var(--canvas-soft)', padding: '16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', marginBottom: '18px' }}>
          <div className="form-group">
            <label className="form-label">
              <Globe size={12} style={{ display: 'inline', marginRight: '5px' }} />
              Project URL
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={12} style={{ display: 'inline', marginRight: '5px' }} />
              Anon Public API Key
            </label>
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
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {currentCreds.isCustom && (
              <button className="button-utility" onClick={handleClear} style={{ color: 'var(--accent-orange)' }}>
                Reset
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
                <strong>{testResult.success ? 'Success' : 'Error'}:</strong>{' '}
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

        {/* Sync Actions */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Push Data to Cloud Tables
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              className="button-utility"
              style={{ padding: '10px', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={handleSyncDisney}
              disabled={isSyncingDisney}
            >
              <UploadCloud size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Push Disney Cruises</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  {isSyncingDisney ? 'Pushing...' : `${disneyData.length} records to table`}
                </div>
              </div>
            </button>

            <button
              className="button-utility"
              style={{ padding: '10px', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={handleSyncIngredients}
              disabled={isSyncingIng}
            >
              <UploadCloud size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Push Ingredients</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  {isSyncingIng ? 'Pushing...' : `${ingredientsData.length} suppliers to table`}
                </div>
              </div>
            </button>
          </div>

          {syncMessage && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
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

        {/* SQL Schema Preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
              <Terminal size={11} style={{ display: 'inline', marginRight: '4px' }} />
              SQL DDL Script
            </span>
            <button className="button-utility" onClick={handleCopySql} style={{ padding: '2px 8px', fontSize: '11px' }}>
              {copiedSql ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedSql ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="code-box" style={{ maxHeight: '160px' }}>
            {schemaSql}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="button-utility"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink size={12} />
          </a>

          <button className="button-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
