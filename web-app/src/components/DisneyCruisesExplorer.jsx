import React, { useState, useMemo } from 'react';
import { 
  Search, Download, UploadCloud, LayoutGrid, Table as TableIcon, 
  ExternalLink, MapPin, Anchor, Sparkles, Eye, X 
} from 'lucide-react';

export default function DisneyCruisesExplorer({ data, source, onSyncSupabase, isSyncing }) {
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedShip, setSelectedShip] = useState('ALL');
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedCruise, setSelectedCruise] = useState(null);

  const destinations = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.destination).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  const ships = useMemo(() => {
    const list = Array.from(new Set(data.map(d => d.ship).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

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
    <div>
      {/* Signature Deep Indigo "Night" Hero Band */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Disney Cruise Lines Explorer</h2>
            <p>
              Scraping, persistence, and intelligence pipeline extracting sailings, itineraries, multi-tier stateroom
              pricing, and departure ports from disneycruise.disney.go.com.
            </p>
            <div className="hero-stickers-row">
              <span className="sticker-tag sky">
                <Sparkles size={12} /> Objective 1
              </span>
              <span className="sticker-tag teal">
                Source: {source === 'supabase' ? 'Supabase Cloud Table' : 'Local Verified Cache'}
              </span>
              <span className="sticker-tag purple">
                {data.length} Total Sailings
              </span>
              <span className="sticker-tag green">
                {kpis.pacificCount} Pacific Sailings
              </span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="button-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export CSV
            </button>
            <button 
              className="button-primary" 
              onClick={() => onSyncSupabase('disney_cruises', data)}
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
            <span className="kpi-title">Total Sailings</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-sky)' }} />
          </div>
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-subtitle">Fleet records extracted</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pacific Destination</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-teal)' }} />
          </div>
          <div className="kpi-value">{kpis.pacificCount}</div>
          <div className="kpi-subtitle">Question (i) answer</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Holiday Cruises</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-purple)' }} />
          </div>
          <div className="kpi-value">{kpis.holidayCount}</div>
          <div className="kpi-subtitle">Question (iii) answer</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Miami & London Ports</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-orange)' }} />
          </div>
          <div className="kpi-value">{kpis.miamiLondonCount}</div>
          <div className="kpi-subtitle">Question (v) answer</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Avg Starting Price</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-green)' }} />
          </div>
          <div className="kpi-value">${kpis.avgPrice.toLocaleString()}</div>
          <div className="kpi-subtitle">Interior stateroom</div>
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
              placeholder="Filter sailings, ship, port..."
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
            className={`button-utility ${holidayOnly ? 'active' : ''}`}
            onClick={() => setHolidayOnly(!holidayOnly)}
            style={{ fontWeight: holidayOnly ? 600 : 400 }}
          >
            <Sparkles size={13} /> Holiday Only
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
                  <th className="sortable" onClick={() => handleSort('title')}>
                    Cruise Title {sortBy === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('ship')}>
                    Ship {sortBy === 'ship' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('departing_from')}>
                    Departing From {sortBy === 'departing_from' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('destination')}>
                    Destination {sortBy === 'destination' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('nights')}>
                    Duration {sortBy === 'nights' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('interior_price')}>
                    Interior {sortBy === 'interior_price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('balcony_price')}>
                    Balcony {sortBy === 'balcony_price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('available_dates_count')}>
                    Dates {sortBy === 'available_dates_count' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Tags</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCruise(item)}>
                    <td>
                      <strong style={{ color: 'var(--ink)' }}>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                        {item.date_range} ({item.weekday_range})
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill sky">{item.ship}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--ink-muted)' }} />
                        <span>{item.departing_from}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-pill ${item.destination === 'Pacific' ? 'green' : 'neutral'}`}>
                        {item.destination}
                      </span>
                    </td>
                    <td>{item.duration}</td>
                    <td>
                      <span className="price-ink">${Number(item.interior_price).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="price-ink" style={{ color: 'var(--primary)' }}>
                        ${Number(item.balcony_price).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge-pill neutral">
                        {item.available_dates_count} Dates
                      </span>
                    </td>
                    <td>
                      {item.is_holiday_cruise && (
                        <span className="badge-pill purple">
                          <Sparkles size={11} /> {item.holiday_theme}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="button-utility"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCruise(item);
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
          {filteredData.map((item) => (
            <div key={item.id} className="feature-card" onClick={() => setSelectedCruise(item)}>
              <div className="card-media">
                <img src={item.image_url} alt={item.title} loading="lazy" />
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                  {item.is_holiday_cruise && (
                    <span className="badge-pill purple">Holiday</span>
                  )}
                  {item.destination === 'Pacific' && (
                    <span className="badge-pill green">Pacific</span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <div className="card-meta-line">
                  <span className="badge-pill sky">{item.ship}</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                  <span>•</span>
                  <span>{item.available_dates_count} Dates</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '8px' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {item.departing_from}
                </div>

                <div className="card-desc">
                  {item.itinerary}
                </div>

                <div className="card-footer">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>From</span>
                    <div className="price-ink" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      ${Number(item.interior_price).toLocaleString()}
                    </div>
                  </div>

                  <a
                    href={item.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="button-utility"
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
              <X size={18} />
            </button>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span className="badge-pill sky">{selectedCruise.ship}</span>
                <span className="badge-pill neutral">{selectedCruise.duration}</span>
                {selectedCruise.is_holiday_cruise && (
                  <span className="badge-pill purple">{selectedCruise.holiday_theme}</span>
                )}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                {selectedCruise.title}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                ID: {selectedCruise.id} • Destination: {selectedCruise.destination}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Departure Port</span>
                <div style={{ fontWeight: 600, marginTop: '2px', fontSize: '14px' }}>{selectedCruise.departing_from}</div>
              </div>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date Range</span>
                <div style={{ fontWeight: 600, marginTop: '2px', fontSize: '14px' }}>{selectedCruise.date_range}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Itinerary
              </h4>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', fontSize: '14px', lineHeight: '1.6' }}>
                {selectedCruise.itinerary}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Stateroom Pricing
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '8px', borderRadius: 'var(--rounded-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Interior</div>
                  <div className="price-ink">${Number(selectedCruise.interior_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '8px', borderRadius: 'var(--rounded-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Oceanview</div>
                  <div className="price-ink">${Number(selectedCruise.oceanview_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '8px', borderRadius: 'var(--rounded-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--primary)' }}>Balcony</div>
                  <div className="price-ink" style={{ color: 'var(--primary)' }}>${Number(selectedCruise.balcony_price).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '8px', borderRadius: 'var(--rounded-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-purple-deep)' }}>Suite</div>
                  <div className="price-ink">${Number(selectedCruise.suite_price).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Bonuses & Entertainment
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: '1.6' }}>
                {selectedCruise.bonuses}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="button-utility" onClick={() => setSelectedCruise(null)}>
                Close
              </button>
              <a
                href={selectedCruise.booking_url}
                target="_blank"
                rel="noreferrer"
                className="button-primary"
              >
                <span>View on Disney Cruise</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
