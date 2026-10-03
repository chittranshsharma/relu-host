import React, { useState } from 'react';
import { CheckCircle2, Copy, Sparkles, Terminal, ExternalLink, Check } from 'lucide-react';
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
  const disneyMoreThan2Dates = disneyData.filter(d => Number(d.available_dates_count) > 2).length;
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
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div>
      {/* Deep Indigo Hero Band */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Challenge Answers & Audit</h2>
            <p>
              Automated evaluation and aggregation for the official hiring submission questions,
              calculated dynamically from verified persistent database records.
            </p>
            <div className="hero-stickers-row">
              <span className="sticker-tag sky">
                <Sparkles size={12} /> Google Form Verified
              </span>
              <span className="sticker-tag purple">
                Disney Cruises: {disneyData.length}
              </span>
              <span className="sticker-tag green">
                Ingredients Suppliers: {ingredientsData.length}
              </span>
            </div>
          </div>

          <div className="hero-actions">
            <a
              href="https://forms.gle/88e7tcW1boyZdL1y9"
              target="_blank"
              rel="noreferrer"
              className="button-secondary"
            >
              <span>Submission Form</span>
              <ExternalLink size={13} />
            </a>
            <button className="button-primary" onClick={handleCopyAll}>
              {copiedAll ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedAll ? 'Copied to Clipboard' : 'Copy All Answers'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side QA Cards */}
      <div className="qa-grid">
        {/* Objective 1 */}
        <div className="qa-card">
          <div className="qa-card-header">
            <h3>Objective 1: Disney Cruise Lines</h3>
            <button className="button-utility" onClick={handleCopyObj1}>
              {copiedObj1 ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedObj1 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(i) How many total cruises are there for the Pacific as a destination?</div>
              <div className="qa-sub">Filter: destination ILIKE '%Pacific%'</div>
            </div>
            <div className="qa-pill">{disneyPacificCount}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(ii) How many total cruises are there?</div>
              <div className="qa-sub">Aggregate: total extracted sailings</div>
            </div>
            <div className="qa-pill">{disneyTotalCount}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(iii) How many holiday cruises are there?</div>
              <div className="qa-sub">Filter: is_holiday_cruise = TRUE</div>
            </div>
            <div className="qa-pill">{disneyHolidayCount}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(iv) How many Cruises offer more than 2 dates for booking?</div>
              <div className="qa-sub">Filter: available_dates_count &gt; 2</div>
            </div>
            <div className="qa-pill">{disneyMoreThan2Dates}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(v) How many cruises do Miami and London have as departure ports?</div>
              <div className="qa-sub">Filter: Miami, London, Southampton</div>
            </div>
            <div className="qa-pill">{disneyMiamiLondonCount}</div>
          </div>

          <div style={{ marginTop: '16px', background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '12px', borderRadius: 'var(--rounded-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={13} /> SQL Query Equivalence
            </div>
            <div className="code-box" style={{ marginTop: '6px', padding: '8px' }}>
              SELECT * FROM public.v_disney_challenge_metrics;
            </div>
          </div>
        </div>

        {/* Objective 2 */}
        <div className="qa-card">
          <div className="qa-card-header">
            <h3>Objective 2: Ingredients Network</h3>
            <button className="button-utility" onClick={handleCopyObj2}>
              {copiedObj2 ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedObj2 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(i) How many total ingredients are there?</div>
              <div className="qa-sub">Aggregate: SUM(ingredients_count)</div>
            </div>
            <div className="qa-pill">{ingTotalIngredients.toLocaleString()}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(ii) How many total finished products are there?</div>
              <div className="qa-sub">Aggregate: SUM(finished_products_count)</div>
            </div>
            <div className="qa-pill">{ingTotalFinished.toLocaleString()}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(iii) How many companies have herbs and spices?</div>
              <div className="qa-sub">Filter: has_herbs_and_spices = TRUE</div>
            </div>
            <div className="qa-pill">{ingHerbsCount}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(iv) How many companies have physical delivery formats?</div>
              <div className="qa-sub">Filter: has_physical_delivery_formats = TRUE</div>
            </div>
            <div className="qa-pill">{ingDeliveryCount}</div>
          </div>

          <div className="qa-row">
            <div>
              <div className="qa-question">(v) How many companies are in Cognitive & Mental Health?</div>
              <div className="qa-sub">Filter: in_cognitive_mental_health = TRUE</div>
            </div>
            <div className="qa-pill">{ingCognitiveCount}</div>
          </div>

          <div style={{ marginTop: '16px', background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', padding: '12px', borderRadius: 'var(--rounded-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={13} /> SQL Query Equivalence
            </div>
            <div className="code-box" style={{ marginTop: '6px', padding: '8px' }}>
              SELECT * FROM public.v_ingredients_challenge_metrics;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
