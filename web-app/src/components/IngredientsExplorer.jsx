import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, UploadCloud, LayoutGrid, Table as TableIcon, 
  ExternalLink, Mail, Phone, MapPin, Leaf, Sparkles, Building2, Eye, X, Check, Globe 
} from 'lucide-react';

export default function IngredientsExplorer({ data, source, onSyncSupabase, isSyncing }) {
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('ALL');
  const [herbsOnly, setHerbsOnly] = useState(false);
  const [cognitiveOnly, setCognitiveOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [sortBy, setSortBy] = useState('company_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Derived filter activities
  const activities = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.primary_business_activity).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCompanies = data.length;
    const totalIngredients = data.reduce((acc, d) => acc + (Number(d.ingredients_count) || 0), 0);
    const totalFinished = data.reduce((acc, d) => acc + (Number(d.finished_products_count) || 0), 0);
    const herbsCount = data.filter(d => d.has_herbs_and_spices).length;
    const deliveryCount = data.filter(d => d.has_physical_delivery_formats).length;
    const cognitiveCount = data.filter(d => d.in_cognitive_mental_health).length;

    return { totalCompanies, totalIngredients, totalFinished, herbsCount, deliveryCount, cognitiveCount };
  }, [data]);

  // Filtering & Sorting
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.company_description && item.company_description.toLowerCase().includes(q)) ||
        (item.categories && item.categories.toLowerCase().includes(q)) ||
        (item.address && item.address.toLowerCase().includes(q)) ||
        (item.sales_markets && item.sales_markets.toLowerCase().includes(q));

      const matchActivity = selectedActivity === 'ALL' || item.primary_business_activity === selectedActivity;
      const matchHerbs = !herbsOnly || item.has_herbs_and_spices;
      const matchCognitive = !cognitiveOnly || item.in_cognitive_mental_health;
      const matchDelivery = !deliveryOnly || item.has_physical_delivery_formats;

      return matchSearch && matchActivity && matchHerbs && matchCognitive && matchDelivery;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [data, search, selectedActivity, herbsOnly, cognitiveOnly, deliveryOnly, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = [
      'Company Name', 'Company Description', 'Sales Markets', 'Primary Business Activity',
      'Categories', 'Events', 'Address', 'Email', 'Telephone', 'Website'
    ];

    const rows = filteredData.map(d => [
      `"${(d.company_name || '').replace(/"/g, '""')}"`,
      `"${(d.company_description || '').replace(/"/g, '""')}"`,
      `"${(d.sales_markets || '').replace(/"/g, '""')}"`,
      `"${(d.primary_business_activity || '').replace(/"/g, '""')}"`,
      `"${(d.categories || '').replace(/"/g, '""')}"`,
      `"${(d.events || '').replace(/"/g, '""')}"`,
      `"${(d.address || '').replace(/"/g, '""')}"`,
      `"${(d.email || '').replace(/"/g, '""')}"`,
      `"${(d.telephone || '').replace(/"/g, '""')}"`,
      `"${(d.website || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ingredients_network_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="section-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-info">
          <h2>
            <Leaf className="text-emerald" size={24} style={{ color: 'var(--accent-emerald)' }} />
            Ingredients & Finished Products Network
          </h2>
          <p>
            Comprehensive supplier intelligence extracted from ingredientsnetwork.com, capturing full company
            profiles, delivery formats, health & wellness verticals, and direct buyer contact information.
          </p>
          <div className="hero-meta-badges">
            <span className="meta-badge highlight" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <Sparkles size={12} /> Challenge Objective 2
            </span>
            <span className="meta-badge">
              Active Source: <strong>{source === 'supabase' ? 'Supabase Table (ingredients_network)' : 'Local Scraped Cache'}</strong>
            </span>
            <span className="meta-badge">
              Total Verified Companies: {data.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export Clean CSV
          </button>
          <button 
            className="btn btn-emerald" 
            onClick={() => onSyncSupabase('ingredients_network', data)}
            disabled={isSyncing}
          >
            <UploadCloud size={15} /> {isSyncing ? 'Syncing...' : 'Sync to Supabase'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Ingredients</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}><Leaf size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {kpis.totalIngredients.toLocaleString()}
          </div>
          <div className="kpi-subtitle">Question (i) aggregated count</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Finished Products</span>
            <div className="kpi-icon-wrap"><Building2 size={18} /></div>
          </div>
          <div className="kpi-value">{kpis.totalFinished.toLocaleString()}</div>
          <div className="kpi-subtitle">Question (ii) aggregated count</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Herbs & Spices</span>
            <div className="kpi-icon-wrap"><Sparkles size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {kpis.herbsCount} / {kpis.totalCompanies}
          </div>
          <div className="kpi-subtitle">Question (iii) company count</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Physical Delivery Formats</span>
            <div className="kpi-icon-wrap"><TableIcon size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {kpis.deliveryCount} / {kpis.totalCompanies}
          </div>
          <div className="kpi-subtitle">Question (iv) delivery forms</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Cognitive & Mental Health</span>
            <div className="kpi-icon-wrap"><Sparkles size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
            {kpis.cognitiveCount} / {kpis.totalCompanies}
          </div>
          <div className="kpi-subtitle">Question (v) health sector</div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search companies, ingredients, categories, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
          >
            {activities.map(a => (
              <option key={a} value={a}>
                {a === 'ALL' ? 'All Activities' : a}
              </option>
            ))}
          </select>

          <button
            className={`btn ${herbsOnly ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setHerbsOnly(!herbsOnly)}
          >
            <Leaf size={14} /> Herbs & Spices
          </button>

          <button
            className={`btn ${cognitiveOnly ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setCognitiveOnly(!cognitiveOnly)}
          >
            <Sparkles size={14} /> Cognitive Health
          </button>
        </div>

        <div className="toolbar-right">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredData.length}</strong> of {data.length}
          </span>

          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table Grid View"
            >
              <TableIcon size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Visual Cards View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: Table */}
      {viewMode === 'table' ? (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('company_name')}>
                    Company Name {sortBy === 'company_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('primary_business_activity')}>
                    Primary Activity {sortBy === 'primary_business_activity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th>Categories</th>
                  <th>Sales Markets</th>
                  <th className="sortable" onClick={() => handleSort('ingredients_count')}>
                    Ingredients {sortBy === 'ingredients_count' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('finished_products_count')}>
                    Finished {sortBy === 'finished_products_count' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th>Address & Location</th>
                  <th>Contact Info</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCompany(item)}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                        {item.company_name}
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        {item.has_herbs_and_spices && (
                          <span className="badge badge-amber">Herbs & Spices</span>
                        )}
                        {item.in_cognitive_mental_health && (
                          <span className="badge badge-purple">Cognitive Health</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{item.primary_business_activity}</span>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.categories}
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                        {item.sales_markets}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-emerald">{item.ingredients_count}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{item.finished_products_count}</span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.address}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {item.email && (
                          <a 
                            href={`mailto:${item.email}`}
                            title={item.email}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Mail size={15} />
                          </a>
                        )}
                        {item.telephone && (
                          <a 
                            href={`tel:${item.telephone}`}
                            title={item.telephone}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Phone size={15} />
                          </a>
                        )}
                        {item.website && (
                          <a 
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            title={item.website}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            <Globe size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(item);
                        }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Cards */
        <div className="cards-grid">
          {filteredData.map((item) => (
            <div key={item.id} className="data-card" onClick={() => setSelectedCompany(item)}>
              <div className="card-image-wrap" style={{ height: '140px' }}>
                <img src={item.logo_url} alt={item.company_name} loading="lazy" />
                <div className="card-badge-overlay">
                  {item.has_herbs_and_spices && (
                    <span className="badge badge-amber">Herbs & Spices</span>
                  )}
                  {item.in_cognitive_mental_health && (
                    <span className="badge badge-purple">Cognitive</span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="card-title">{item.company_name}</div>
                <div className="card-meta-row">
                  <span className="badge badge-cyan">{item.primary_business_activity}</span>
                  <span>•</span>
                  <span>{item.ingredients_count} Ingredients</span>
                </div>

                <div className="card-description">
                  {item.company_description}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <strong>Categories:</strong> {item.categories}
                </div>

                <div className="card-footer">
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {item.address.split(',').pop()?.trim()}
                  </div>

                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Website</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCompany(null)}>
              <X size={20} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-cyan">{selectedCompany.primary_business_activity}</span>
                {selectedCompany.has_herbs_and_spices && (
                  <span className="badge badge-amber">Herbs & Spices</span>
                )}
                {selectedCompany.in_cognitive_mental_health && (
                  <span className="badge badge-purple">Cognitive Health</span>
                )}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700' }}>{selectedCompany.company_name}</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ID: {selectedCompany.id} • Markets: {selectedCompany.sales_markets}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                COMPANY PROFILE & OVERVIEW
              </h4>
              <p style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: '1.6' }}>
                {selectedCompany.company_description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Formats</span>
                <div style={{ fontWeight: '500', fontSize: '13px', marginTop: '4px' }}>
                  {selectedCompany.delivery_formats || 'Not Specified'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming Trade Events</span>
                <div style={{ fontWeight: '500', fontSize: '13px', marginTop: '4px' }}>
                  {selectedCompany.events || 'Fi Europe, Vitafoods'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                VERIFIED CONTACT DETAILS
              </h4>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{selectedCompany.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                  <a href={`mailto:${selectedCompany.email}`} style={{ color: 'var(--accent-cyan)' }}>
                    {selectedCompany.email}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{selectedCompany.telephone}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCompany(null)}>
                Close
              </button>
              <a
                href={selectedCompany.website}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <span>Visit Official Site</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
