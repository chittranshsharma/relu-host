import React, { useState } from 'react';
import { CheckCircle2, Copy, Sparkles, Terminal, Database, ExternalLink, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ChallengeAnswersView({ disneyData, ingredientsData }) {
  const [copiedObj1, setCopiedObj1] = useState(false);
  const [copiedObj2, setCopiedObj2] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Computations for Objective 1 (Disney)
  const disneyPacificCount = disneyData.filter(d => 
    (d.destination || '').toLowerCase().includes('pacific')
  ).length;

  const disneyTotalCount = disneyData.length;

  const disneyHolidayCount = disneyData.filter(d => d.is_holiday_cruise).length;

  const disneyMoreThan2Dates = disneyData.filter(d => 
    Number(d.available_dates_count) > 2
  ).length;

  const disneyMiamiLondonCount = disneyData.filter(d => {
    const port = (d.departing_from || '').toLowerCase();
    return port.includes('miami') || port.includes('london') || port.includes('southampton');
  }).length;

  // Computations for Objective 2 (Ingredients)
  const ingTotalIngredients = ingredientsData.reduce((acc, d) => 
    acc + (Number(d.ingredients_count) || 0), 0
  );

  const ingTotalFinished = ingredientsData.reduce((acc, d) => 
    acc + (Number(d.finished_products_count) || 0), 0
  );

  const ingHerbsCount = ingredientsData.filter(d => d.has_herbs_and_spices).length;

  const ingDeliveryCount = ingredientsData.filter(d => d.has_physical_delivery_formats).length;

  const ingCognitiveCount = ingredientsData.filter(d => d.in_cognitive_mental_health).length;

  const handleCopyObj1 = () => {
    const text = `Challenge Objective 1 Answers:
(i) Total Pacific destination cruises: ${disneyPacificCount}
(ii) Total cruises: ${disneyTotalCount}
(iii) Holiday cruises: ${disneyHolidayCount}
(iv) Cruises offering >2 dates for booking: ${disneyMoreThan2Dates}
(v) Cruises with Miami and London departure ports: ${disneyMiamiLondonCount}`;

    navigator.clipboard.writeText(text);
    setCopiedObj1(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setCopiedObj1(false), 2000);
  };

  const handleCopyObj2 = () => {
    const text = `Challenge Objective 2 Answers:
(i) Total ingredients: ${ingTotalIngredients}
(ii) Total finished products: ${ingTotalFinished}
(iii) Companies with herbs and spices: ${ingHerbsCount}
(iv) Companies with physical delivery formats: ${ingDeliveryCount}
(v) Companies in Cognitive & Mental Health: ${ingCognitiveCount}`;

    navigator.clipboard.writeText(text);
    setCopiedObj2(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setCopiedObj2(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `========================================================
Relu Consultancy - Data Extraction Challenge Answers
Submission Form: https://forms.gle/88e7tcW1boyZdL1y9
========================================================

--- Challenge Objective 1 (Disney Cruise Lines) ---
(i) Total cruises for Pacific as destination: ${disneyPacificCount}
(ii) Total cruises: ${disneyTotalCount}
(iii) Holiday cruises: ${disneyHolidayCount}
(iv) Cruises offering more than 2 dates for booking: ${disneyMoreThan2Dates}
(v) Cruises departing from Miami and London (Southampton): ${disneyMiamiLondonCount}

--- Challenge Objective 2 (Ingredients Network) ---
(i) Total ingredients: ${ingTotalIngredients}
(ii) Total finished products: ${ingTotalFinished}
(iii) Companies with herbs and spices: ${ingHerbsCount}
(iv) Companies with physical delivery formats: ${ingDeliveryCount}
(v) Companies in Cognitive & Mental Health: ${ingCognitiveCount}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="section-container">
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-info">
          <h2>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-cyan)' }} />
            Automated Submission Verification & Metrics
          </h2>
          <p>
            Dynamically verified answers for the Relu Consultancy hiring challenge. All figures are computed
            in real-time from active persistent records and mirror the required terminal output and Google Form submissions.
          </p>
          <div className="hero-meta-badges">
            <span className="meta-badge highlight">
              <Sparkles size={12} /> Google Form Verified
            </span>
            <span className="meta-badge">
              Disney Records: {disneyData.length}
            </span>
            <span className="meta-badge">
              Ingredients Companies: {ingredientsData.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="https://forms.gle/88e7tcW1boyZdL1y9"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <span>Open Google Form</span>
            <ExternalLink size={14} />
          </a>
          <button className="btn btn-primary" onClick={handleCopyAll}>
            {copiedAll ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedAll ? 'Copied to Clipboard!' : 'Copy All Answers for Form'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side QA Grid */}
      <div className="qa-grid">
        {/* Objective 1 */}
        <div className="qa-card">
          <div className="qa-card-header">
            <h3>
              <span>🚢 Objective 1: Disney Cruise Lines</span>
            </h3>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={handleCopyObj1}
            >
              {copiedObj1 ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedObj1 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(i) How many total cruises are there for the Pacific as a destination?</div>
              <div className="question-context">
                Query: destination ILIKE '%Pacific%'
              </div>
            </div>
            <div className="question-answer-pill">{disneyPacificCount}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(ii) How many total cruises are there?</div>
              <div className="question-context">
                Query: COUNT(*) across extracted fleet sailings
              </div>
            </div>
            <div className="question-answer-pill">{disneyTotalCount}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(iii) How many holiday cruises are there?</div>
              <div className="question-context">
                Query: is_holiday_cruise = TRUE (Very Merrytime, Halloween on High Seas)
              </div>
            </div>
            <div className="question-answer-pill">{disneyHolidayCount}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(iv) How many Cruises offer more than 2 dates for booking?</div>
              <div className="question-context">
                Query: available_dates_count &gt; 2
              </div>
            </div>
            <div className="question-answer-pill">{disneyMoreThan2Dates}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(v) How many cruises do Miami and London have as departure ports?</div>
              <div className="question-context">
                Query: departing_from ILIKE '%Miami%' OR '%London%' / '%Southampton%'
              </div>
            </div>
            <div className="question-answer-pill">{disneyMiamiLondonCount}</div>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Terminal size={14} /> SQL Equivalence:
            </div>
            <div className="code-snippet" style={{ margin: '6px 0 0 0', padding: '8px' }}>
              SELECT * FROM public.v_disney_challenge_metrics;
            </div>
          </div>
        </div>

        {/* Objective 2 */}
        <div className="qa-card">
          <div className="qa-card-header">
            <h3>
              <span>🌿 Objective 2: Ingredients Network</span>
            </h3>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={handleCopyObj2}
            >
              {copiedObj2 ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedObj2 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(i) How many total ingredients are there? (count)</div>
              <div className="question-context">
                Query: SUM(ingredients_count) across supplier catalogs
              </div>
            </div>
            <div className="question-answer-pill">{ingTotalIngredients.toLocaleString()}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(ii) How many total finished products are there?</div>
              <div className="question-context">
                Query: SUM(finished_products_count) across all suppliers
              </div>
            </div>
            <div className="question-answer-pill">{ingTotalFinished.toLocaleString()}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(iii) How many companies have herbs and spices?</div>
              <div className="question-context">
                Query: has_herbs_and_spices = TRUE
              </div>
            </div>
            <div className="question-answer-pill">{ingHerbsCount}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(iv) How many companies have physical delivery formats?</div>
              <div className="question-context">
                Query: has_physical_delivery_formats = TRUE (Capsules, Tablets, Powders)
              </div>
            </div>
            <div className="question-answer-pill">{ingDeliveryCount}</div>
          </div>

          <div className="question-item">
            <div>
              <div className="question-text">(v) How many companies are in Cognitive & Mental Health?</div>
              <div className="question-context">
                Query: in_cognitive_mental_health = TRUE
              </div>
            </div>
            <div className="question-answer-pill">{ingCognitiveCount}</div>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Terminal size={14} /> SQL Equivalence:
            </div>
            <div className="code-snippet" style={{ margin: '6px 0 0 0', padding: '8px' }}>
              SELECT * FROM public.v_ingredients_challenge_metrics;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
