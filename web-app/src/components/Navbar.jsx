import React from 'react';
import { Database, Ship, Leaf, CheckCircle2, Sliders } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, supabaseStatus, onOpenSettings }) {
  return (
    <header className="nav-bar">
      <div className="nav-inner">
        <div className="nav-brand">
          <div className="brand-icon-box">
            <span>R</span>
          </div>
          <div className="brand-text">
            <h1>Relu DataCore</h1>
            <span className="brand-sub">Persistence & Presentation Hub</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'disney' ? 'active' : ''}`}
            onClick={() => setActiveTab('disney')}
          >
            <Ship size={15} />
            <span>Disney Cruises</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <Leaf size={15} />
            <span>Ingredients Network</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'answers' ? 'active' : ''}`}
            onClick={() => setActiveTab('answers')}
          >
            <CheckCircle2 size={15} />
            <span>Challenge Answers</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            <Database size={15} />
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
              className={`status-dot ${
                supabaseStatus?.connected ? 'connected' : 'local'
              }`}
            />
            <span>
              {supabaseStatus?.connected ? (
                <>
                  Supabase Live <small style={{ color: 'var(--ink-muted)' }}>({supabaseStatus.latencyMs}ms)</small>
                </>
              ) : (
                'Local Mode'
              )}
            </span>
          </div>

          <button className="button-utility" onClick={onOpenSettings}>
            <Sliders size={14} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
