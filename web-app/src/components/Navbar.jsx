import React from 'react';
import { Database, Ship, Leaf, CheckCircle2, ShieldCheck, Sparkles, Sliders } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, supabaseStatus, onOpenSettings }) {
  return (
    <header className="top-navbar">
      <div className="nav-inner">
        <div className="nav-brand">
          <div className="brand-logo-badge">
            <Sparkles size={20} />
          </div>
          <div className="brand-text">
            <h1>Relu DataCore</h1>
            <span className="brand-sub">Hiring Challenge Intelligence Hub</span>
          </div>
        </div>

        <nav className="nav-center-tabs">
          <button
            className={`tab-btn ${activeTab === 'disney' ? 'active' : ''}`}
            onClick={() => setActiveTab('disney')}
          >
            <Ship size={16} />
            <span>Disney Cruises</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <Leaf size={16} />
            <span>Ingredients Network</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'answers' ? 'active' : ''}`}
            onClick={() => setActiveTab('answers')}
          >
            <CheckCircle2 size={16} />
            <span>Challenge Answers</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            <Database size={16} />
            <span>Supabase Cloud</span>
          </button>
        </nav>

        <div className="nav-actions">
          <div
            className="status-pill"
            onClick={onOpenSettings}
            title="Click to view or edit Supabase credentials"
          >
            <span
              className={`status-indicator-dot ${
                supabaseStatus?.connected ? 'connected' : 'local'
              }`}
            />
            <span>
              {supabaseStatus?.connected ? (
                <>
                  Supabase Live <small style={{ color: 'var(--text-muted)' }}>({supabaseStatus.latencyMs}ms)</small>
                </>
              ) : (
                'Local Mode (Supabase Ready)'
              )}
            </span>
          </div>

          <button className="btn btn-ghost" onClick={onOpenSettings}>
            <Sliders size={15} />
            <span>Connect DB</span>
          </button>
        </div>
      </div>
    </header>
  );
}
