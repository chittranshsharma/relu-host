import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, UploadCloud, LayoutGrid, Table as TableIcon, 
  ExternalLink, Calendar, MapPin, Anchor, Sparkles, DollarSign, Eye, X, Check 
} from 'lucide-react';

export default function DisneyCruisesExplorer({ data, source, onSyncSupabase, isSyncing }) {
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedShip, setSelectedShip] = useState('ALL');
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedCruise, setSelectedCruise] = useState(null);

  // Derived filter options
  const destinations = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.destination).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  const ships = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.ship).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  // KPIs
  const kpis = useMemo(() => {
    const total = data.length;
    const pacificCount = data.filter(d => (d.destination || '').toLowerCase().includes('pacific')).length;
    const holidayCount = data.filter(d => d.is_holiday_cruise).length;
    const moreThan2Dates = data.filter(d => (d.available_dates_count || 0) > 2).length;
    const miamiLondonCount = data.filter(d => {
      const port = (d.departing_from || '').toLowerCase();
      return port.includes('miami') || port.includes('london') || port.includes('southampton');
    }).length;

    const avgPrice = Math.round(
      data.reduce((acc, d) => acc + (Number(d.interior_price) || 0), 0) / (total || 1)
    );

    return { total, pacificCount, holidayCount, moreThan2Dates, miamiLondonCount, avgPrice };
  }, [data]);

  // Filtering & Sorting
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = 
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.ship && item.ship.toLowerCase().includes(q)) ||
        (item.departing_from && item.departing_from.toLowerCase().includes(q)) ||
        (item.destination && item.destination.toLowerCase().includes(q)) ||
        (item.itinerary && item.itinerary.toLowerCase().includes(q));

      const matchDest = selectedDestination === 'ALL' || item.destination === selectedDestination;
      const matchShip = selectedShip === 'ALL' || item.ship === selectedShip;
      const matchHoliday = !holidayOnly || item.is_holiday_cruise;

      return matchSearch && matchDest && matchShip && matchHoliday;
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
  }, [data, search, selectedDestination, selectedShip, holidayOnly, sortBy, sortOrder]);

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
      'Title', 'Ship', 'Departing From', 'Duration', 'Itinerary', 
      'Date Range', 'Weekday Range', 'Interior Price', 'Oceanview Price', 
      'Balcony Price', 'Suite Price', 'Booking URL', 'Bonuses'
    ];

    const rows = filteredData.map(d => [
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.ship || '').replace(/"/g, '""')}"`,
      `"${(d.departing_from || '').replace(/"/g, '""')}"`,
      `"${(d.duration || '').replace(/"/g, '""')}"`,
      `"${(d.itinerary || '').replace(/"/g, '""')}"`,
      `"${(d.date_range || '').replace(/"/g, '""')}"`,
      `"${(d.weekday_range || '').replace(/"/g, '""')}"`,
      `"$${d.interior_price || 0}"`,
      `"$${d.oceanview_price || 0}"`,
      `"$${d.balcony_price || 0}"`,
      `"$${d.suite_price || 0}"`,
      `"${d.booking_url || ''}"`,
      `"${(d.bonuses || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'disney_cruises_results.csv');
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
            <Anchor className="text-cyan" size={24} style={{ color: 'var(--accent-cyan)' }} />
            Disney Cruise Lines Intelligence
          </h2>
          <p>
            Real-time scraping and persistence pipeline extracting sailings, itineraries, multi-tier pricing,
            holiday specials, and departure ports from disneycruise.disney.go.com.
          </p>
          <div className="hero-meta-badges">
            <span className="meta-badge highlight">
              <Sparkles size={12} /> Challenge Objective 1
            </span>
            <span className="meta-badge">
              Active Source: <strong>{source === 'supabase' ? 'Supabase Table (disney_cruises)' : 'Local Scraped Cache'}</strong>
            </span>
            <span className="meta-badge">
              Total Records: {data.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export Clean CSV
          </button>
          <button 
            className="btn btn-emerald" 
            onClick={() => onSyncSupabase('disney_cruises', data)}
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
            <span className="kpi-title">Total Sailings</span>
            <div className="kpi-icon-wrap"><Anchor size={18} /></div>
          </div>
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-subtitle">Extracted across all fleet ships</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pacific Destination</span>
            <div className="kpi-icon-wrap"><MapPin size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {kpis.pacificCount}
          </div>
          <div className="kpi-subtitle">Question (i) verification count</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Holiday Cruises</span>
            <div className="kpi-icon-wrap"><Sparkles size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
            {kpis.holidayCount}
          </div>
          <div className="kpi-subtitle">Very Merrytime & Halloween</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Miami & London Ports</span>
            <div className="kpi-icon-wrap"><MapPin size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {kpis.miamiLondonCount}
          </div>
          <div className="kpi-subtitle">Question (v) departure count</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Avg Starting Price</span>
            <div className="kpi-icon-wrap"><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value">${kpis.avgPrice.toLocaleString()}</div>
          <div className="kpi-subtitle">Standard interior stateroom</div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by title, ship, departure port, or itinerary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
          >
            {destinations.map(d => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Destinations' : d}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedShip}
            onChange={(e) => setSelectedShip(e.target.value)}
          >
            {ships.map(s => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Ships' : s}
              </option>
            ))}
          </select>

          <button
            className={`btn ${holidayOnly ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setHolidayOnly(!holidayOnly)}
          >
            <Sparkles size={14} /> Holiday Only
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
                  <th className="sortable" onClick={() => handleSort('title')}>
                    Cruise Title {sortBy === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('ship')}>
                    Ship {sortBy === 'ship' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('departing_from')}>
                    Departing From {sortBy === 'departing_from' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('destination')}>
                    Destination {sortBy === 'destination' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('nights')}>
                    Duration {sortBy === 'nights' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('interior_price')}>
                    Interior {sortBy === 'interior_price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('balcony_price')}>
                    Balcony {sortBy === 'balcony_price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('available_dates_count')}>
                    Dates {sortBy === 'available_dates_count' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th>Tags</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCruise(item)}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.date_range} ({item.weekday_range})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{item.ship}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{item.departing_from}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.destination === 'Pacific' ? 'badge-emerald' : 'badge-gray'}`}>
                        {item.destination}
                      </span>
                    </td>
                    <td>{item.duration}</td>
                    <td>
                      <span className="price-display">${Number(item.interior_price).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="price-display" style={{ color: 'var(--accent-cyan)' }}>
                        ${Number(item.balcony_price).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {item.available_dates_count} {item.available_dates_count === 1 ? 'Date' : 'Dates'}
                      </span>
                    </td>
                    <td>
                      {item.is_holiday_cruise && (
                        <span className="badge badge-purple">
                          <Sparkles size={11} /> {item.holiday_theme}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCruise(item);
                        }}
                      >
                        <Eye size={13} /> Details
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
            <div key={item.id} className="data-card" onClick={() => setSelectedCruise(item)}>
              <div className="card-image-wrap">
                <img src={item.image_url} alt={item.title} loading="lazy" />
                <div className="card-badge-overlay">
                  {item.is_holiday_cruise && (
                    <span className="badge badge-purple">
                      <Sparkles size={11} /> {item.holiday_theme}
                    </span>
                  )}
                  {item.destination === 'Pacific' && (
                    <span className="badge badge-emerald">Pacific</span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <div className="card-meta-row">
                  <span className="badge badge-cyan">{item.ship}</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                  <span>•</span>
                  <span>{item.available_dates_count} Dates</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  <strong>Departs:</strong> {item.departing_from}
                </div>

                <div className="card-description">
                  {item.itinerary}
                </div>

                <div className="card-footer">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Price from</span>
                    <div className="price-display" style={{ fontSize: '18px', color: 'var(--accent-cyan)' }}>
                      ${Number(item.interior_price).toLocaleString()}
                    </div>
                  </div>

                  <a
                    href={item.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Book</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cruise Detail Modal */}
      {selectedCruise && (
        <div className="modal-overlay" onClick={() => setSelectedCruise(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCruise(null)}>
              <X size={20} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-cyan">{selectedCruise.ship}</span>
                <span className="badge badge-gray">{selectedCruise.duration}</span>
                {selectedCruise.is_holiday_cruise && (
                  <span className="badge badge-purple">{selectedCruise.holiday_theme}</span>
                )}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedCruise.title}</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ID: {selectedCruise.id} • Destination: {selectedCruise.destination}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Departure Port</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{selectedCruise.departing_from}</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date Range</span>
                <div style={{ fontWeight: '600', marginTop: '2px' }}>{selectedCruise.date_range} ({selectedCruise.weekday_range})</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                FULL ITINERARY
              </h4>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: '1.6' }}>
                {selectedCruise.itinerary}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                STATEROOM PRICING BREAKDOWN
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interior</div>
                  <div className="price-display">${Number(selectedCruise.interior_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Oceanview</div>
                  <div className="price-display">${Number(selectedCruise.oceanview_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>Balcony</div>
                  <div className="price-display" style={{ color: 'var(--accent-cyan)' }}>${Number(selectedCruise.balcony_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-purple)' }}>Suite</div>
                  <div className="price-display" style={{ color: 'var(--accent-purple)' }}>${Number(selectedCruise.suite_price).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                SPECIAL BONUSES & PERKS
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {selectedCruise.bonuses}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCruise(null)}>
                Close
              </button>
              <a
                href={selectedCruise.booking_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <span>Open Official Booking</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
