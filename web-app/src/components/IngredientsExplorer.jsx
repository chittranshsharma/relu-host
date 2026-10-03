import React, { useState, useMemo } from 'react';
import { 
  Search, Download, UploadCloud, LayoutGrid, Table as TableIcon, 
  ExternalLink, Mail, Phone, MapPin, Leaf, Sparkles, Building2, Eye, X, Globe 
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedActivity, herbsOnly, cognitiveOnly, deliveryOnly, sortBy, sortOrder]);

  const activities = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.primary_business_activity).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  const kpis = useMemo(() => {
    const totalCompanies = data.length;
    const totalIngredients = data.reduce((acc, d) => acc + (Number(d.ingredients_count) || 0), 0);
    const totalFinished = data.reduce((acc, d) => acc + (Number(d.finished_products_count) || 0), 0);
    const herbsCount = data.filter(d => d.has_herbs_and_spices).length;
    const deliveryCount = data.filter(d => d.has_physical_delivery_formats).length;
    const cognitiveCount = data.filter(d => d.in_cognitive_mental_health).length;
    return { totalCompanies, totalIngredients, totalFinished, herbsCount, deliveryCount, cognitiveCount };
  }, [data]);

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

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

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
    <div>
      {/* Deep Indigo "Night" Hero Band */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Ingredients & Finished Products Network</h2>
            <p>
              Scraped supplier profiles, delivery formats, and buyer contacts from ingredientsnetwork.com,
              structured with persistence to Supabase and clean export compliance.
            </p>
            <div className="hero-stickers-row">
              <span className={source === 'supabase' ? 'source-badge-live' : 'source-badge-local'}>
                {source === 'supabase' ? '● Supabase Cloud Live' : '○ Local Verified Cache'}
              </span>
              <span className="sticker-tag green">
                {kpis.totalCompanies} Active Suppliers
              </span>
              <span className="sticker-tag orange">
                {kpis.herbsCount} Herbs &amp; Spices
              </span>
              <span className="sticker-tag purple">
                {kpis.cognitiveCount} Cognitive Health
              </span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="button-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export Clean CSV
            </button>
            <button 
              className="button-primary" 
              onClick={() => onSyncSupabase('ingredients_network', data)}
              disabled={isSyncing}
            >
              <UploadCloud size={15} /> {isSyncing ? 'Syncing...' : 'Sync to Supabase'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Ingredients</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-green)' }} />
          </div>
          <div className="kpi-value">{kpis.totalIngredients.toLocaleString()}</div>
          <div className="kpi-subtitle">Indexed catalog ingredients</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Finished Products</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-sky)' }} />
          </div>
          <div className="kpi-value">{kpis.totalFinished.toLocaleString()}</div>
          <div className="kpi-subtitle">Formulated market products</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Herbs &amp; Spices</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-orange)' }} />
          </div>
          <div className="kpi-value">{kpis.herbsCount} / {kpis.totalCompanies}</div>
          <div className="kpi-subtitle">Active botanical suppliers</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Physical Delivery Formats</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-teal)' }} />
          </div>
          <div className="kpi-value">{kpis.deliveryCount} / {kpis.totalCompanies}</div>
          <div className="kpi-subtitle">Dosage &amp; encapsulation tech</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Cognitive &amp; Mental Health</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-purple)' }} />
          </div>
          <div className="kpi-value">{kpis.cognitiveCount} / {kpis.totalCompanies}</div>
          <div className="kpi-subtitle">Nootropics &amp; wellness sector</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="text-input-wrap">
            <Search className="input-icon" size={15} />
            <input
              type="text"
              className="text-input"
              placeholder="Search companies, categories, address..."
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
            className={`button-utility ${herbsOnly ? 'active' : ''}`}
            onClick={() => setHerbsOnly(!herbsOnly)}
            style={{ fontWeight: herbsOnly ? 600 : 400 }}
          >
            <Leaf size={13} /> Herbs & Spices
          </button>

          <button
            className={`button-utility ${cognitiveOnly ? 'active' : ''}`}
            onClick={() => setCognitiveOnly(!cognitiveOnly)}
            style={{ fontWeight: cognitiveOnly ? 600 : 400 }}
          >
            <Sparkles size={13} /> Cognitive Health
          </button>
        </div>

        <div className="toolbar-right">
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            <strong>{filteredData.length}</strong> of {data.length}
          </span>

          <div className="view-toggle-box">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <TableIcon size={14} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Cards view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View: Table */}
      {viewMode === 'table' ? (
        <div className="table-card">
          <div className="table-scroll">
            <table className="notion-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('company_name')}>
                    Company Name {sortBy === 'company_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('primary_business_activity')}>
                    Primary Activity {sortBy === 'primary_business_activity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Categories</th>
                  <th>Sales Markets</th>
                  <th className="sortable" onClick={() => handleSort('ingredients_count')}>
                    Ingredients {sortBy === 'ingredients_count' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('finished_products_count')}>
                    Finished {sortBy === 'finished_products_count' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCompany(item)}>
                    <td>
                      <strong style={{ color: 'var(--ink)' }}>{item.company_name}</strong>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {item.has_herbs_and_spices && (
                          <span className="badge-pill orange">Herbs & Spices</span>
                        )}
                        {item.in_cognitive_mental_health && (
                          <span className="badge-pill purple">Cognitive</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill sky">{item.primary_business_activity}</span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.categories}
                      </div>
                    </td>
                    <td style={{ maxWidth: '180px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink-secondary)' }}>
                        {item.sales_markets}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill green">{item.ingredients_count}</span>
                    </td>
                    <td>
                      <span className="badge-pill neutral">{item.finished_products_count}</span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <MapPin size={12} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
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
                            style={{ color: 'var(--ink-muted)' }}
                          >
                            <Mail size={14} />
                          </a>
                        )}
                        {item.telephone && (
                          <a 
                            href={`tel:${item.telephone}`}
                            title={item.telephone}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--ink-muted)' }}
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {item.website && (
                          <a 
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            title={item.website}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--primary)' }}
                          >
                            <Globe size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="button-utility"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(item);
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View: Cards */
        <div className="cards-grid">
          {paginatedData.map((item) => (
            <div key={item.id} className="feature-card" onClick={() => setSelectedCompany(item)}>
              <div className="card-media" style={{ height: '130px' }}>
                <img src={item.logo_url} alt={item.company_name} loading="lazy" />
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  {item.has_herbs_and_spices && (
                    <span className="badge-pill orange">Herbs</span>
                  )}
                  {item.in_cognitive_mental_health && (
                    <span className="badge-pill purple">Cognitive</span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="card-title">{item.company_name}</div>
                <div className="card-meta-line">
                  <span className="badge-pill sky">{item.primary_business_activity}</span>
                  <span>•</span>
                  <span>{item.ingredients_count} Ingredients</span>
                </div>

                <div className="card-desc">
                  {item.company_description}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '12px' }}>
                  <strong>Categories:</strong> {item.categories}
                </div>

                <div className="card-footer">
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {item.address.split(',').pop()?.trim()}
                  </div>

                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="button-utility"
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

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '18px',
          padding: '12px 16px',
          background: 'var(--canvas-elevated)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--rounded-md)',
          fontSize: '13px'
        }}>
          <span style={{ color: 'var(--ink-muted)' }}>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> – <strong>{Math.min(currentPage * pageSize, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> suppliers
          </span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="button-utility"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ fontWeight: 600, padding: '0 8px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="button-utility"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCompany(null)}>
              <X size={18} />
            </button>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span className="badge-pill sky">{selectedCompany.primary_business_activity}</span>
                {selectedCompany.has_herbs_and_spices && (
                  <span className="badge-pill orange">Herbs & Spices</span>
                )}
                {selectedCompany.in_cognitive_mental_health && (
                  <span className="badge-pill purple">Cognitive Health</span>
                )}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                {selectedCompany.company_name}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                ID: {selectedCompany.id} • Markets: {selectedCompany.sales_markets}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Company Profile
              </h4>
              <p style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', fontSize: '14px', lineHeight: '1.6' }}>
                {selectedCompany.company_description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Formats</span>
                <div style={{ fontWeight: 500, fontSize: '13px', marginTop: '3px' }}>
                  {selectedCompany.delivery_formats || 'Not Specified'}
                </div>
              </div>

              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Trade Events</span>
                <div style={{ fontWeight: 500, fontSize: '13px', marginTop: '3px' }}>
                  {selectedCompany.events || 'Fi Europe, Vitafoods'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Contact Information
              </h4>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--ink-muted)' }} />
                  <span>{selectedCompany.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--ink-muted)' }} />
                  <a href={`mailto:${selectedCompany.email}`} style={{ color: 'var(--primary)' }}>
                    {selectedCompany.email}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--ink-muted)' }} />
                  <span>{selectedCompany.telephone}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="button-utility" onClick={() => setSelectedCompany(null)}>
                Close
              </button>
              <a
                href={selectedCompany.website}
                target="_blank"
                rel="noreferrer"
                className="button-primary"
              >
                <span>Visit Company Site</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

