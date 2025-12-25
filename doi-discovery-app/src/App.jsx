import React, { useState } from 'react';
import { parseReferences } from './utils/parser';
import { resolveDOI } from './utils/crossref';

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [userEmail, setUserEmail] = useState('');
  const [includeIndices, setIncludeIndices] = useState(true);

  const handleResolve = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    const references = parseReferences(inputText);

    // Initialize results with pending state
    const initialResults = references.map(ref => ({
      ...ref,
      status: 'pending',
      doi: null,
      message: null,
      title: null
    }));
    setResults(initialResults);
    setProgress({ current: 0, total: initialResults.length });

    // Process one by one
    const updatedResults = [...initialResults];

    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      try {
        const result = await resolveDOI(ref.text, userEmail || 'placeholder@example.com');
        updatedResults[i] = {
          ...updatedResults[i],
          status: result.found ? 'success' : 'not-found',
          doi: result.doi,
          title: result.title,
          message: result.error
        };
      } catch (e) {
        updatedResults[i] = {
          ...updatedResults[i],
          status: 'error',
          message: 'Network Error'
        };
      }

      setResults([...updatedResults]); // Real-time update
      setProgress(prev => ({ ...prev, current: i + 1 }));

      await new Promise(r => setTimeout(r, 300));
    }

    setLoading(false);
  };

  const handleCopy = () => {
    // Include all results to maintain order
    const textToCopy = results
      .map(r => {
        let content = '';
        if (r.status === 'success') {
          content = `https://doi.org/${r.doi}`;
        } else {
          content = 'Unknown/Unidentified';
        }

        const cleanId = r.id.replace(/[\[\]]/g, '');
        return includeIndices ? `[${cleanId}] ${content}` : content;
      })
      .join('\n');

    navigator.clipboard.writeText(textToCopy);
    alert(`Copied ${results.length} results to clipboard!`);
  };

  const clearAll = () => {
    setInputText('');
    setResults([]);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="app-container">
      <header>
        <h1>DOI Discovery</h1>
        <p className="subtitle">Batch resolve citations leveraging Crossref API</p>
      </header>

      <main className="main-content">
        <section className="card input-section">
          <div className="card-header">
            <span className="card-title">Input References</span>
            <button className="btn-secondary" onClick={clearAll}>Clear</button>
          </div>

          <div className="card-body">
            <div className="options-area">
              <input
                type="email"
                className="input-field"
                placeholder="Optional: Your email for Polite Pool usage"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <textarea
              placeholder="Paste your references here (e.g., [1] Author, Title...)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              spellCheck="false"
            />

            <div className="action-area">
              <div style={{ marginRight: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                {loading && `PROCESSING ${progress.current} / ${progress.total}`}
              </div>
              <button className="btn-primary" onClick={handleResolve} disabled={loading}>
                {loading ? <div className="loading-spinner"></div> : 'RESOLVE DOIS'}
              </button>
            </div>
          </div>
        </section>

        <section className="card output-section">
          <div className="card-header">
            <span className="card-title">Results ({results.filter(r => r.status === 'success').length} / {results.length} Resolved)</span>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeIndices}
                  onChange={e => setIncludeIndices(e.target.checked)}
                />
                Include Indices
              </label>
              <button className="btn-secondary" onClick={handleCopy}>
                Copy Results
              </button>
            </div>
          </div>

          <div className="results-list">
            {results.length === 0 && (
              <div className="empty-state">
                <p>RESULTS WILL APPEAR HERE</p>
              </div>
            )}

            {results.map((item, idx) => (
              <div key={idx} className="result-item">
                <div className="result-main-line">
                  <div className="icon-wrapper">
                    {item.status === 'pending' && <div className="loading-spinner small"></div>}
                    {item.status === 'success' && <span className="status-icon status-success">✓</span>}
                    {item.status === 'not-found' && <span className="status-icon status-error">×</span>}
                    {item.status === 'error' && <span className="status-icon status-error">!</span>}
                  </div>

                  <div className="result-content">
                    {item.status === 'success' ? (
                      <>
                        <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer" className="doi-link-large">
                          {item.doi} ↗
                        </a>
                        <div className="result-title">{item.title}</div>
                      </>
                    ) : (
                      <div className="result-title" style={{ color: 'var(--text-primary)', opacity: 0.5 }}>
                        {item.status === 'pending' ? 'Resolving...' : (item.status === 'error' ? 'Network Error' : 'DOI Not Found')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="source-line">
                  <span className="source-label">SRC</span>
                  <span className="source-text">{item.id} {item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
