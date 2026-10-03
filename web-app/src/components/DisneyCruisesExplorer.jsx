import React, { useState, useMemo } from 'react';
import { 
  Search, Download, UploadCloud, LayoutGrid, Table as TableIcon, 
  ExternalLink, MapPin, Anchor, Sparkles, Eye, X, Calendar, Compass 
} from 'lucide-react';

export default function DisneyCruisesExplorer({ data, source, onSyncSupabase, isSyncing }) {
  const [search, setSearch] = useState('');
  const [selectedPort, setSelectedPort] = useState('ALL');
  const [selectedDuration, setSelectedDuration] = useState('ALL');
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [selectedCruise, setSelectedCruise] = useState(null);

  // Field normalization helpers
  const getPort = (d) => d.departure_port || d.departing_from || 'Disney Port';
  const getDestination = (d) => d.sailing_to || d.destination || 'Open Sea';
  const getDurationText = (d) => d.duration || (d.duration_nights ? `${d.duration_nights} Nights` : 'Multi-day');
  const getNights = (d) => Number(d.duration_nights) || (d.duration ? parseInt(d.duration) : 0);
  const getShip = (d) => d.ship || (d.sailing_to && d.sailing_to.includes('|') ? d.sailing_to.split('|').pop().trim() : 'Disney Fleet');
  const getDatesCount = (d) => d.num_dates ?? d.available_dates_count ?? 1;
  const isHoliday = (d) => !!(d.is_holiday_cruise || (d.theme_badge && d.theme_badge.toLowerCase().includes('merry')));
  const getBookingUrl = (d) => (d.cta_link && d.cta_link !== '#') ? d.cta_link : (d.booking_url || 'https://disneycruise.disney.go.com');

  const formatPrice = (d) => {
    if (d.price_inr) {
      return `₹${Number(d.price_inr).toLocaleString()}`;
    }
    if (d.interior_price) {
      return `$${Number(d.interior_price).toLocaleString()}`;
    }
    if (d.price_usd) {
      return `$${Number(d.price_usd).toLocaleString()}`;
    }
    return 'Check site';
  };

  const getNumericPrice = (d) => {
    return Number(d.price_inr) || Number(d.interior_price) || Number(d.price_usd) || 0;
  };

  // Distinct Departure Ports
  const departurePorts = useMemo(() => {
    const list = Array.from(new Set(data.map(d => getPort(d)).filter(Boolean)));
    return ['ALL', ...list.sort()];
  }, [data]);

  // Executive KPI calculations
  const kpis = useMemo(() => {
    const total = data.length;
    const holidayCount = data.filter(d => isHoliday(d)).length;
    const moreThan2Dates = data.filter(d => getDatesCount(d) > 2).length;
    const portsCount = new Set(data.map(d => getPort(d)).filter(Boolean)).size;
    const pricedCruises = data.filter(d => getNumericPrice(d) > 0);
    const avgPrice = pricedCruises.length 
      ? Math.round(pricedCruises.reduce((acc, d) => acc + getNumericPrice(d), 0) / pricedCruises.length)
      : 0;

    return { total, holidayCount, moreThan2Dates, portsCount, avgPrice };
  }, [data]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase();
      const port = getPort(item).toLowerCase();
      const title = (item.title || '').toLowerCase();
      const destination = getDestination(item).toLowerCase();
      const ship = getShip(item).toLowerCase();
      const theme = (item.theme_badge || item.holiday_theme || '').toLowerCase();

      const matchSearch = 
        !q ||
        title.includes(q) ||
        port.includes(q) ||
        destination.includes(q) ||
        ship.includes(q) ||
        theme.includes(q);

      const matchPort = selectedPort === 'ALL' || getPort(item) === selectedPort;
      
      let matchDur = true;
      const nights = getNights(item);
      if (selectedDuration === 'short') matchDur = nights <= 4;
      else if (selectedDuration === 'medium') matchDur = nights >= 5 && nights <= 7;
      else if (selectedDuration === 'long') matchDur = nights >= 8;

      const matchHoliday = !holidayOnly || isHoliday(item);

      return matchSearch && matchPort && matchDur && matchHoliday;
    }).sort((a, b) => {
      let valA, valB;
      if (sortBy === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === 'port') {
        valA = getPort(a).toLowerCase();
        valB = getPort(b).toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === 'nights') {
        valA = getNights(a);
        valB = getNights(b);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'dates') {
        valA = getDatesCount(a);
        valB = getDatesCount(b);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'price') {
        valA = getNumericPrice(a);
        valB = getNumericPrice(b);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [data, search, selectedPort, selectedDuration, holidayOnly, sortBy, sortOrder]);

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
    const headers = ['ID', 'Title', 'Departure Port', 'Duration', 'Sailing To', 'Dates Count', 'Price', 'Theme', 'Quality Badge', 'Booking Link'];
    const rows = filteredData.map(d => [
      `"${d.id || ''}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${getPort(d).replace(/"/g, '""')}"`,
      `"${getDurationText(d)}"`,
      `"${getDestination(d).replace(/"/g, '""')}"`,
      getDatesCount(d),
      `"${formatPrice(d)}"`,
      `"${(d.theme_badge || d.holiday_theme || '').replace(/"/g, '""')}"`,
      `"${(d.quality_badge || '').replace(/"/g, '""')}"`,
      `"${getBookingUrl(d)}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'disney_cruises_extracted.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Signature Deep Indigo Hero Band */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Disney Cruise Lines Explorer</h2>
            <p>
              Scraping, persistence, and intelligence pipeline extracting sailings, itineraries, stateroom
              pricing, and departure ports from disneycruise.disney.go.com.
            </p>
            <div className="hero-stickers-row">
              <span className={source === 'supabase' ? 'source-badge-live' : 'source-badge-local'}>
                {source === 'supabase' ? '● Supabase Cloud Live' : '○ Local Verified Cache'}
              </span>
              <span className="sticker-tag purple">
                {data.length} Total Sailings
              </span>
              <span className="sticker-tag pink">
                {kpis.moreThan2Dates} Multi-Date
              </span>
              <span className="sticker-tag orange">
                {kpis.holidayCount} Holiday Sailings
              </span>
              <span className="sticker-tag teal">
                {kpis.portsCount} Departure Ports
              </span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="button-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export Clean CSV
            </button>
            <button 
              className="button-primary" 
              onClick={() => onSyncSupabase('disney_cruises_final', data)}
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
          <div className="kpi-subtitle">Extracted catalog itineraries</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Multi-Date Sailings</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-pink)' }} />
          </div>
          <div className="kpi-value">{kpis.moreThan2Dates}</div>
          <div className="kpi-subtitle">Cruises offering &gt;2 dates</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Holiday & Seasonal</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-purple)' }} />
          </div>
          <div className="kpi-value">{kpis.holidayCount}</div>
          <div className="kpi-subtitle">Very Merrytime & seasonal</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Departure Ports</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-teal)' }} />
          </div>
          <div className="kpi-value">{kpis.portsCount}</div>
          <div className="kpi-subtitle">Unique global homeports</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Starting Rates</span>
            <span className="kpi-sticker-dot" style={{ background: 'var(--accent-green)' }} />
          </div>
          <div className="kpi-value">
            {kpis.avgPrice ? `₹${kpis.avgPrice.toLocaleString()}` : 'Live rates'}
          </div>
          <div className="kpi-subtitle">Average starting stateroom</div>
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
              placeholder="Search sailing, port, route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
          >
            {departurePorts.map(p => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All Departure Ports' : p}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
          >
            <option value="ALL">All Durations</option>
            <option value="short">Short (1-4 Nights)</option>
            <option value="medium">Medium (5-7 Nights)</option>
            <option value="long">Long (8+ Nights)</option>
          </select>

          <button
            className={`button-utility ${holidayOnly ? 'active' : ''}`}
            onClick={() => setHolidayOnly(!holidayOnly)}
            style={{ fontWeight: holidayOnly ? 600 : 400 }}
          >
            <Sparkles size={13} /> Holiday Themes
          </button>
        </div>

        <div className="toolbar-right">
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            <strong>{filteredData.length}</strong> of {data.length} sailings
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
                  <th className="sortable" onClick={() => handleSort('port')}>
                    Departure Port {sortBy === 'port' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Route / Destination</th>
                  <th className="sortable" onClick={() => handleSort('nights')}>
                    Duration {sortBy === 'nights' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('dates')}>
                    Dates {sortBy === 'dates' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sortable" onClick={() => handleSort('price')}>
                    Starting Price {sortBy === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Theme & Badges</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedCruise(item)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong style={{ color: 'var(--ink)' }}>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                        {item.date_range ? `${item.date_range} (${item.weekday_range || ''})` : `Ref: ${item.id}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--ink-muted)' }} />
                        <span>{getPort(item)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getDestination(item)}
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill neutral">{getDurationText(item)}</span>
                    </td>
                    <td>
                      <span className={`badge-pill ${getDatesCount(item) > 2 ? 'pink' : 'neutral'}`}>
                        <Calendar size={11} /> {getDatesCount(item)} {getDatesCount(item) === 1 ? 'Date' : 'Dates'}
                      </span>
                    </td>
                    <td>
                      <span className="price-ink" style={{ color: 'var(--primary)' }}>
                        {formatPrice(item)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {isHoliday(item) && (
                          <span className="badge-pill purple">
                            <Sparkles size={11} /> {item.theme_badge || item.holiday_theme || 'Holiday'}
                          </span>
                        )}
                        {item.quality_badge && (
                          <span className="badge-pill green">{item.quality_badge}</span>
                        )}
                        {!isHoliday(item) && !item.quality_badge && (
                          <span className="badge-pill neutral">Standard</span>
                        )}
                      </div>
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
            <div key={item.id} className="feature-card" onClick={() => setSelectedCruise(item)} style={{ cursor: 'pointer' }}>
              <div className="card-media">
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80'} 
                  alt={item.title} 
                  loading="lazy" 
                />
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                  {isHoliday(item) && (
                    <span className="badge-pill purple">
                      <Sparkles size={10} /> Holiday
                    </span>
                  )}
                  {item.quality_badge && (
                    <span className="badge-pill green">{item.quality_badge}</span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <div className="card-meta-line">
                  <span className="badge-pill sky">{getShip(item)}</span>
                  <span>•</span>
                  <span>{getDurationText(item)}</span>
                  <span>•</span>
                  <span>{getDatesCount(item)} Dates</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '8px' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {getPort(item)}
                </div>

                <div className="card-desc">
                  {getDestination(item)}
                </div>

                <div className="card-footer">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Starting from</span>
                    <div className="price-ink" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      {formatPrice(item)}
                    </div>
                  </div>

                  <a
                    href={getBookingUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="button-utility"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Explore</span>
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
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className="badge-pill sky">{getShip(selectedCruise)}</span>
                <span className="badge-pill neutral">{getDurationText(selectedCruise)}</span>
                {isHoliday(selectedCruise) && (
                  <span className="badge-pill purple">
                    <Sparkles size={11} /> {selectedCruise.theme_badge || selectedCruise.holiday_theme || 'Holiday Theme'}
                  </span>
                )}
                {selectedCruise.quality_badge && (
                  <span className="badge-pill green">{selectedCruise.quality_badge}</span>
                )}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                {selectedCruise.title}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                Ref: {selectedCruise.id} • Available departures: {getDatesCount(selectedCruise)} dates
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Departure Port</span>
                <div style={{ fontWeight: 600, marginTop: '2px', fontSize: '14px' }}>{getPort(selectedCruise)}</div>
              </div>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Starting Rate</span>
                <div style={{ fontWeight: 600, marginTop: '2px', fontSize: '14px', color: 'var(--primary)' }}>{formatPrice(selectedCruise)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Route & Destinations
              </h4>
              <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', fontSize: '14px', lineHeight: '1.6' }}>
                {getDestination(selectedCruise)}
              </div>
            </div>

            {selectedCruise.itinerary && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Detailed Itinerary
                </h4>
                <div style={{ background: 'var(--canvas-soft)', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)', fontSize: '13px', lineHeight: '1.6' }}>
                  {selectedCruise.itinerary}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button className="button-utility" onClick={() => setSelectedCruise(null)}>
                Close
              </button>
              <a
                href={getBookingUrl(selectedCruise)}
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
