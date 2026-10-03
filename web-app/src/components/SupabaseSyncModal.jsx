import React, { useState } from 'react';
import { 
  Database, ShieldCheck, Check, Copy, ExternalLink, RefreshCw, 
  UploadCloud, AlertCircle, X, Key, Globe, Terminal, Sparkles 
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

  const schemaSql = `-- Run this in your Supabase SQL Editor:
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="brand-logo-badge" style={{ width: '42px', height: '42px' }}>
            <Database size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Supabase Persistence Hub</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configure your free Supabase cloud instance or sync extracted tables in one click.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">
              <Globe size={13} style={{ display: 'inline', marginRight: '6px' }} />
              Supabase Project URL
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
              <Key size={13} style={{ display: 'inline', marginRight: '6px' }} />
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
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
                Reset to Default
              </button>
            )}
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              style={{
                marginTop: '14px',
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
                <strong>{testResult.success ? 'Connection Successful' : 'Connection Failed'}:</strong>{' '}
                {testResult.message}
                {testResult.latencyMs > 0 && (
                  <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                    ({testResult.latencyMs}ms latency)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sync Actions */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            One-Click Data Sync to Cloud
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '12px', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={handleSyncDisney}
              disabled={isSyncingDisney}
            >
              <UploadCloud size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Sync Disney Cruises</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isSyncingDisney ? 'Pushing records...' : `Push ${disneyData.length} records to Supabase`}
                </div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '12px', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={handleSyncIngredients}
              disabled={isSyncingIng}
            >
              <UploadCloud size={18} style={{ color: 'var(--accent-emerald)' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Sync Ingredients Network</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isSyncingIng ? 'Pushing records...' : `Push ${ingredientsData.length} suppliers to Supabase`}
                </div>
              </div>
            </button>
          </div>

          {syncMessage && (
            <div
              style={{
                marginTop: '12px',
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

        {/* SQL Schema Snippet */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <Terminal size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Database DDL Schema (Run in Supabase SQL Editor)
            </span>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleCopySql}>
              {copiedSql ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          <pre className="code-snippet" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {schemaSql}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: '12px' }}
          >
            <span>Supabase Dashboard</span>
            <ExternalLink size={13} />
          </a>

          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
