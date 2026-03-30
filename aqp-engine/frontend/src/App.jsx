import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const API = 'http://localhost:8000';

const SAMPLE_QUERIES = [
  'SELECT COUNT(*) FROM data GROUP BY region',
  'SELECT SUM(price) FROM data GROUP BY product',
  'SELECT AVG(revenue) FROM data GROUP BY category',
  'SELECT COUNT(*) FROM data',
  'SELECT SUM(price) FROM data',
  'SELECT AVG(price) FROM data',
];

function formatVal(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    return Object.entries(v)
      .map(([k, val]) => `${k}: ${Number(val).toLocaleString()}`)
      .join('  |  ');
  }
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function App() {
  const [query, setQuery] = useState('SELECT COUNT(*) FROM data GROUP BY region');
  const [fraction, setFraction] = useState(0.1);
  const [useStratified, setUseStratified] = useState(false);
  const [result, setResult] = useState(null);
  const [benchData, setBenchData] = useState(null);
  const [canStratify, setCanStratify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [benchLoading, setBenchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('query');

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${API}/query?query=${encodeURIComponent(query)}&sample_fraction=${fraction}&use_stratified=${useStratified}`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, fraction, useStratified]);

  const runBenchmark = useCallback(async () => {
    setBenchLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/benchmark?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBenchData(data.benchmark);
      setCanStratify(data.can_stratify);
      setActiveTab('bench');
    } catch (e) {
      setError(e.message);
    } finally {
      setBenchLoading(false);
    }
  }, [query]);

  const pct = Math.round(fraction * 100);
  const isGroupBy = query.toLowerCase().includes('group by');

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.badge}>HACKATHON BUILD</div>
            <h1 style={styles.title}>AQP <span style={{ color: 'var(--accent)' }}>ENGINE</span></h1>
            <p style={styles.subtitle}>Approximate Query Processing — fast answers with tunable accuracy</p>
          </div>
          <div style={styles.stats}>
            <Stat label="Dataset" value="1M rows" />
            <Stat label="Engine" value="Python + FastAPI" />
            <Stat label="Speedup" value="up to 10×" accent />
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Tabs */}
        <div style={styles.tabs}>
          {['query', 'bench'].map(t => (
            <button key={t} style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(t)}>
              {t === 'query' ? '⚡ Query Runner' : '📈 Benchmark'}
            </button>
          ))}
        </div>

        {/* Query Panel */}
        {activeTab === 'query' && (
          <div style={styles.panel}>
            {/* Sample queries */}
            <div style={styles.section}>
              <label style={styles.label}>SAMPLE QUERIES</label>
              <div style={styles.chips}>
                {SAMPLE_QUERIES.map(q => (
                  <button key={q} style={{ ...styles.chip, ...(query === q ? styles.chipActive : {}) }}
                    onClick={() => setQuery(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Query input */}
            <div style={styles.section}>
              <label style={styles.label}>SQL QUERY</label>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={styles.textarea}
                rows={2}
                spellCheck={false}
              />
            </div>

            {/* Sampling method toggle */}
            <div style={styles.section}>
              <label style={styles.label}>SAMPLING METHOD</label>
              <div style={styles.toggleRow}>
                <button
                  style={{ ...styles.toggleBtn, ...((!useStratified) ? styles.toggleActive : {}) }}
                  onClick={() => setUseStratified(false)}>
                  🎲 Random Sampling
                </button>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(useStratified ? styles.toggleActiveGreen : {}),
                    ...(!isGroupBy ? styles.toggleDisabled : {})
                  }}
                  onClick={() => isGroupBy && setUseStratified(true)}
                  title={!isGroupBy ? 'Requires GROUP BY query' : ''}>
                  🎯 Stratified Sampling
                  {!isGroupBy && <span style={styles.disabledHint}> (needs GROUP BY)</span>}
                </button>
              </div>
              {useStratified && isGroupBy && (
                <div style={styles.stratInfo}>
                  ✅ <strong>Stratified mode:</strong> Each group is sampled proportionally — significantly lower error on GROUP BY queries.
                </div>
              )}
            </div>

            {/* Accuracy slider */}
            <div style={styles.section}>
              <label style={styles.label}>
                SAMPLE FRACTION — <span style={{ color: 'var(--accent)' }}>{pct}%</span>
                <span style={styles.labelHint}> ({pct === 100 ? 'exact' : `scans ${pct}% of data`})</span>
              </label>
              <div style={styles.sliderRow}>
                <span style={styles.sliderBound}>1%</span>
                <input type="range" min="0.01" max="1" step="0.01"
                  value={fraction} onChange={e => setFraction(parseFloat(e.target.value))}
                  style={styles.slider} />
                <span style={styles.sliderBound}>100%</span>
              </div>
              <div style={styles.accuracyBar}>
                <div style={{ ...styles.accuracyFill, width: `${pct}%` }} />
              </div>
            </div>

            {/* Buttons */}
            <div style={styles.btnRow}>
              <button onClick={runQuery} disabled={loading} style={styles.btnPrimary}>
                {loading ? '⏳ Running...' : '⚡ Run Query'}
              </button>
              <button onClick={runBenchmark} disabled={benchLoading} style={styles.btnSecondary}>
                {benchLoading ? '⏳ Benchmarking...' : '📊 Run Benchmark'}
              </button>
            </div>

            {/* Error */}
            {error && <div style={styles.error}>❌ {error}</div>}

            {/* Results */}
            {result && (
              <div style={styles.results}>
                <div style={styles.methodBadge}>
                  Sampling method used: <strong style={{ color: result.sampling_method === 'stratified' ? 'var(--green)' : 'var(--accent)' }}>
                    {result.sampling_method === 'stratified' ? '🎯 Stratified' : '🎲 Random'}
                  </strong>
                </div>

                <div style={styles.resultsGrid}>
                  <ResultCard
                    title="⚡ APPROXIMATE"
                    value={formatVal(result.approx_result)}
                    meta={`${result.approx_time_ms} ms · ${result.rows_scanned.toLocaleString()} rows scanned`}
                    accent="var(--accent)"
                  />
                  <ResultCard
                    title="🐢 EXACT"
                    value={formatVal(result.exact_result)}
                    meta={`${result.exact_time_ms} ms · ${result.total_rows.toLocaleString()} rows scanned`}
                    accent="var(--muted)"
                  />
                </div>

                <div style={styles.metricsRow}>
                  <Metric label="Speedup" value={`${result.speedup}×`} color="var(--green)" />
                  <Metric label="Error" value={`${result.error_pct}%`}
                    color={result.error_pct < 2 ? 'var(--green)' : result.error_pct < 8 ? 'var(--accent2)' : '#ff4d4d'} />
                  <Metric label="Rows Used" value={`${Math.round(fraction * 100)}%`} color="var(--accent)" />
                  <Metric label="Method" value={result.sampling_method === 'stratified' ? 'STRAT' : 'RANDOM'}
                    color={result.sampling_method === 'stratified' ? 'var(--green)' : 'var(--accent2)'} />
                </div>

                {/* Strata breakdown */}
                {result.sampling_method === 'stratified' && Object.keys(result.strata_info || {}).length > 0 && (
                  <div style={styles.strataTable}>
                    <div style={styles.label}>STRATA BREAKDOWN</div>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {['Group', 'Total Rows', 'Sampled', 'Weight'].map(h => (
                            <th key={h} style={styles.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.strata_info).map(([grp, info]) => (
                          <tr key={grp} style={styles.tr}>
                            <td style={{ ...styles.td, color: 'var(--accent)' }}>{grp}</td>
                            <td style={styles.td}>{info.total.toLocaleString()}</td>
                            <td style={styles.td}>{info.sampled.toLocaleString()}</td>
                            <td style={{ ...styles.td, color: 'var(--green)' }}>{info.weight.toFixed(2)}×</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Benchmark Panel */}
        {activeTab === 'bench' && (
          <div style={styles.panel}>
            {!benchData ? (
              <div style={styles.emptyState}>
                <p style={{ color: 'var(--muted)' }}>Run a benchmark from the Query Runner tab first.</p>
                <button onClick={() => setActiveTab('query')} style={styles.btnSecondary}>← Back to Query</button>
              </div>
            ) : (
              <>
                <div style={styles.section}>
                  <label style={styles.label}>SPEEDUP vs SAMPLE FRACTION</label>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={benchData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                        <XAxis dataKey="fraction" tickFormatter={v => `${Math.round(v * 100)}%`}
                          stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                        <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}×`, 'Speedup']} />
                        <Line type="monotone" dataKey="speedup" stroke="var(--accent)"
                          strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} name="Speedup" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={styles.section}>
                  <label style={styles.label}>
                    ERROR % — RANDOM vs STRATIFIED
                    {!canStratify && <span style={{ color: 'var(--accent2)', marginLeft: 8 }}>(use GROUP BY query to enable stratified comparison)</span>}
                  </label>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={benchData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                        <XAxis dataKey="fraction" tickFormatter={v => `${Math.round(v * 100)}%`}
                          stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                        <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v}%`, n]} />
                        <Legend wrapperStyle={{ fontFamily: 'Space Mono', fontSize: 11 }} />
                        <Line type="monotone" dataKey="error_random" stroke="var(--accent2)"
                          strokeWidth={2} dot={{ fill: 'var(--accent2)', r: 4 }} name="Random Error %" />
                        {canStratify && (
                          <Line type="monotone" dataKey="error_stratified" stroke="var(--green)"
                            strokeWidth={2} dot={{ fill: 'var(--green)', r: 4 }} name="Stratified Error %" strokeDasharray="4 2" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Table */}
                <div style={styles.section}>
                  <label style={styles.label}>FULL BENCHMARK TABLE</label>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Sample %', 'Time (ms)', 'Speedup', 'Random Error %', ...(canStratify ? ['Stratified Error %'] : [])].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {benchData.map(row => (
                        <tr key={row.fraction} style={styles.tr}>
                          <td style={styles.td}>{Math.round(row.fraction * 100)}%</td>
                          <td style={styles.td}>{row.time_ms}</td>
                          <td style={{ ...styles.td, color: 'var(--green)' }}>{row.speedup}×</td>
                          <td style={{ ...styles.td, color: row.error_random < 3 ? 'var(--green)' : row.error_random < 10 ? 'var(--accent2)' : '#ff4d4d' }}>
                            {row.error_random}%
                          </td>
                          {canStratify && (
                            <td style={{ ...styles.td, color: row.error_stratified < 3 ? 'var(--green)' : row.error_stratified < 10 ? 'var(--accent2)' : '#ff4d4d' }}>
                              {row.error_stratified}%
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        AQP Engine · Approximate Query Processing · Built for Hackathon
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={styles.statBox}>
      <div style={{ ...styles.statVal, ...(accent ? { color: 'var(--accent)' } : {}) }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ResultCard({ title, value, meta, accent }) {
  return (
    <div style={{ ...styles.card, borderColor: accent }}>
      <div style={{ ...styles.cardTitle, color: accent }}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardMeta}>{meta}</div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={styles.metric}>
      <div style={{ ...styles.metricVal, color }}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

const tooltipStyle = {
  background: '#12121a',
  border: '1px solid #2a2a3e',
  borderRadius: 6,
  fontFamily: 'Space Mono, monospace',
  fontSize: 12,
  color: '#e8e8f0',
};

const styles = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '24px 0' },
  headerInner: { maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 },
  badge: { fontSize: 10, letterSpacing: 3, color: 'var(--accent2)', marginBottom: 6 },
  title: { fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, lineHeight: 1 },
  subtitle: { color: 'var(--muted)', fontSize: 13, marginTop: 6 },
  stats: { display: 'flex', gap: 24 },
  statBox: { textAlign: 'right' },
  statVal: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 },
  statLabel: { fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 },

  main: { flex: 1, maxWidth: 900, margin: '0 auto', padding: '32px 24px', width: '100%' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' },
  tab: { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },

  panel: { display: 'flex', flexDirection: 'column', gap: 24 },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 10, letterSpacing: 2, color: 'var(--muted)' },
  labelHint: { color: 'var(--muted)', letterSpacing: 0 },

  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 4, padding: '5px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' },
  chipActive: { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(0,229,255,0.06)' },

  textarea: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, resize: 'vertical', outline: 'none', lineHeight: 1.6 },

  toggleRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  toggleBtn: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' },
  toggleActive: { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(0,229,255,0.07)' },
  toggleActiveGreen: { borderColor: 'var(--green)', color: 'var(--green)', background: 'rgba(57,255,126,0.07)' },
  toggleDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  disabledHint: { fontSize: 10, color: 'var(--muted)' },

  stratInfo: { background: 'rgba(57,255,126,0.07)', border: '1px solid rgba(57,255,126,0.25)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: 'var(--green)' },

  sliderRow: { display: 'flex', alignItems: 'center', gap: 12 },
  sliderBound: { fontSize: 11, color: 'var(--muted)', width: 28 },
  slider: { flex: 1, accentColor: 'var(--accent)', height: 4 },
  accuracyBar: { height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' },
  accuracyFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent2), var(--accent))', borderRadius: 2, transition: 'width 0.2s' },

  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  btnPrimary: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '12px 24px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 },
  btnSecondary: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer' },

  error: { background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 6, padding: '12px 16px', color: '#ff4d4d', fontSize: 13 },

  methodBadge: { fontSize: 12, color: 'var(--muted)' },
  results: { display: 'flex', flexDirection: 'column', gap: 16 },
  resultsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: 'var(--surface2)', border: '1px solid', borderRadius: 8, padding: '18px 20px' },
  cardTitle: { fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  cardValue: { fontSize: 14, wordBreak: 'break-all', lineHeight: 1.9, marginBottom: 8 },
  cardMeta: { fontSize: 11, color: 'var(--muted)' },

  metricsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  metric: { flex: 1, minWidth: 100, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', textAlign: 'center' },
  metricVal: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 },
  metricLabel: { fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 4 },

  strataTable: { display: 'flex', flexDirection: 'column', gap: 10 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: 'var(--surface2)', padding: '10px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: 'var(--muted)', borderBottom: '1px solid var(--border)' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 14px' },

  emptyState: { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '60px 0' },
  footer: { textAlign: 'center', padding: '20px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', letterSpacing: 1 },
};
