// frontend/src/App.jsx
import { useState, useEffect } from "react";
import './App.css';
import SchemaExplorer from './SchemaExplorer';
import QueryHistory from './QueryHistory';
import ResultsTable from './ResultsTable';
import DatabaseFlowchart from './DatabaseFlowchart';

function App() {
  const [nlQuery, setNlQuery] = useState("");
  const [result, setResult] = useState(null);
  const [schema, setSchema] = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [queryHistory, setQueryHistory] = useState(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem('nl2sql_queryHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load query history:', error);
      return [];
    }
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [pendingQuery, setPendingQuery] = useState(null);
  const [viewMode, setViewMode] = useState('query'); // 'query' or 'flowchart'
  const [sessionId, setSessionId] = useState(() => {
    // Load session ID from localStorage or null
    try {
      return localStorage.getItem('nl2sql_sessionId') || null;
    } catch (error) {
      return null;
    }
  });

  // Save query history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('nl2sql_queryHistory', JSON.stringify(queryHistory));
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  }, [queryHistory]);

  // Save session ID to localStorage whenever it changes
  useEffect(() => {
    try {
      if (sessionId) {
        localStorage.setItem('nl2sql_sessionId', sessionId);
      }
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://localhost:5001/health");
        if (response.ok) {
          setBackendReady(true);
          fetchSchema();
        }
      } catch (err) {
        console.error("Backend not ready yet...", err);
        setTimeout(checkBackend, 2000);
      }
    };
    checkBackend();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('http://localhost:5001/schema');
      const data = await response.json();
      if (data.success) {
        setSchema(data);
      }
    } catch (err) {
      console.error("Failed to fetch schema:", err);
    }
  };

  const isDestructiveQuery = (sql) => {
    if (!sql) return false;
    const upperSQL = sql.toUpperCase().trim();
    return upperSQL.includes('DELETE ') ||
           upperSQL.includes('DROP ') ||
           upperSQL.includes('TRUNCATE ') ||
           upperSQL.includes('ALTER TABLE');
  };

  const executeQuery = async (queryToExecute) => {
    setLoading(true);
    setResult(null);
    setCopiedSql(false);

    try {
      const response = await fetch("http://localhost:5001/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryToExecute,
          include_schema: true,
          session_id: sessionId  // Include session ID for conversation memory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Save session ID from response
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      if (data.success) {
        setResult({
          type: "success",
          sql: data.sql,
          query: queryToExecute,
          data: data.data || [],
          columns: data.columns || [],
          rowCount: data.row_count || 0
        });

        // Add to history (keep last 50 queries)
        setQueryHistory(prev => {
          const newEntry = { query: queryToExecute, sql: data.sql, timestamp: Date.now() };
          // Remove duplicates and keep most recent
          const filtered = prev.filter(item =>
            item.query.toLowerCase() !== queryToExecute.toLowerCase()
          );
          return [newEntry, ...filtered].slice(0, 50); // Increased from 10 to 50
        });
      } else {
        throw new Error(data.error || "Failed to generate and execute SQL");
      }
    } catch (err) {
      console.error("Error:", err);
      setResult({
        type: "error",
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // First, generate SQL to check if it's destructive
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nlQuery,
          include_schema: true,
          session_id: sessionId  // Include session ID for conversation memory
        }),
      });

      const data = await response.json();

      // Save session ID from response
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      if (data.success && isDestructiveQuery(data.sql)) {
        // Show warning dialog
        setPendingQuery({ query: nlQuery, sql: data.sql });
        setShowDeleteWarning(true);
        setLoading(false);
      } else {
        // Execute normally
        setLoading(false);
        await executeQuery(nlQuery);
      }
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      setResult({
        type: "error",
        message: err.message
      });
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteWarning(false);
    if (pendingQuery) {
      await executeQuery(pendingQuery.query);
      setPendingQuery(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
    setPendingQuery(null);
    setResult(null);
  };

  const copySQLToClipboard = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const clearQueryHistory = () => {
    setQueryHistory([]);
  };

  // Theme colors
  const theme = {
    dark: {
      background: "#0a0e1a",
      cardBg: "#161b2e",
      text: "#e2e8f0",
      textSecondary: "#94a3b8",
      primary: "#3b82f6",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      border: "#1e293b",
      success: "#10b981",
      error: "#ef4444"
    },
    light: {
      background: "#f8fafc",
      cardBg: "#ffffff",
      text: "#1e293b",
      textSecondary: "#64748b",
      primary: "#2563eb",
      secondary: "#4f46e5",
      accent: "#7c3aed",
      border: "#e2e8f0",
      success: "#059669",
      error: "#dc2626"
    }
  };

  const currentTheme = darkMode ? theme.dark : theme.light;

  if (!backendReady) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: currentTheme.background
      }}>
        <div style={{
          background: currentTheme.cardBg,
          padding: "3rem 4rem",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          textAlign: "center",
          border: `1px solid ${currentTheme.border}`
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏳</div>
          <h3 style={{ color: currentTheme.text, margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
            Connecting to backend...
          </h3>
          <p style={{ color: currentTheme.textSecondary, marginTop: "0.5rem", fontSize: "1rem" }}>
            Please wait while we establish connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: currentTheme.background,
      color: currentTheme.text,
      transition: "all 0.3s ease"
    }}>
      {/* Header */}
      <header style={{
        background: currentTheme.cardBg,
        borderBottom: `1px solid ${currentTheme.border}`,
        padding: "1.5rem 2rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
      className="app-header">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1920px",
          margin: "0 auto",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
            <h1 style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: "700",
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap"
            }}
            className="app-title">
              <span style={{ fontSize: "2rem" }}></span>
              <span>Natural Language to SQL</span>
            </h1>
            <p style={{
              margin: "0.25rem 0 0 0",
              color: currentTheme.textSecondary,
              fontSize: "0.95rem"
            }}
            className="app-subtitle">
              Developer-friendly SQL query interface with AI-powered natural language processing
            </p>
          </div>

          {/* View Toggle & Theme Toggle */}
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <button
              onClick={() => setViewMode(viewMode === 'query' ? 'flowchart' : 'query')}
              style={{
                background: currentTheme.cardBg,
                border: `2px solid ${currentTheme.border}`,
                borderRadius: "10px",
                padding: "0.75rem 1.25rem",
                cursor: "pointer",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
                color: currentTheme.text
              }}
              className="view-toggle"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = currentTheme.accent;
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = currentTheme.border;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {viewMode === 'query' ? '📐' : '💬'}
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }} className="theme-label">
                {viewMode === 'query' ? 'Flowchart' : 'Query'}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: currentTheme.cardBg,
                border: `2px solid ${currentTheme.border}`,
                borderRadius: "10px",
                padding: "0.75rem 1.25rem",
                cursor: "pointer",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
                color: currentTheme.text
              }}
              className="theme-toggle"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = currentTheme.primary;
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = currentTheme.border;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {darkMode ? "☀️" : "🌙"}
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }} className="theme-label">
                {darkMode ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Conditional Rendering */}
      {viewMode === 'flowchart' ? (
        /* Flowchart View */
        <div style={{
          maxWidth: "1920px",
          margin: "0 auto",
          padding: "1.5rem",
          height: "calc(100vh - 120px)"
        }}>
          <DatabaseFlowchart schema={schema} darkMode={darkMode} theme={currentTheme} />
        </div>
      ) : (
        /* Query View - Three Sections */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          maxWidth: "1920px",
          margin: "0 auto",
          padding: "1.5rem",
          minHeight: "calc(100vh - 100px)"
        }}
        className="main-grid">
          {/* Section 1: Schema Explorer (Left) */}
          <div style={{
          background: currentTheme.cardBg,
          borderRadius: "12px",
          border: `1px solid ${currentTheme.border}`,
          maxHeight: "calc(100vh - 130px)",
          position: "sticky",
          top: "115px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          gridColumn: "span 1",
          minWidth: "280px"
        }}
        className="schema-section">
          <SchemaExplorer schema={schema} darkMode={darkMode} theme={currentTheme} />
        </div>

        {/* Section 2: Query Editor & Results (Center) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          gridColumn: "span 1",
          minWidth: "400px"
        }}
        className="query-section">
          {/* Query Input */}
          <div style={{
            background: currentTheme.cardBg,
            borderRadius: "12px",
            border: `1px solid ${currentTheme.border}`,
            padding: "1.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <label style={{
              marginBottom: "1rem",
              color: currentTheme.text,
              fontSize: "1.1rem",
              fontWeight: "700",
              display: "block"
            }}>
              Natural Language Query
            </label>

            <textarea
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g., Show all employees in the IT department with salary greater than 60000"
              disabled={loading}
              style={{
                width: "90%",
                minHeight: "120px",
                padding: "1rem",
                fontSize: "1rem",
                lineHeight: "1.6",
                border: `2px solid ${currentTheme.border}`,
                borderRadius: "8px",
                outline: "none",
                transition: "all 0.3s ease",
                backgroundColor: loading ? currentTheme.background : currentTheme.cardBg,
                color: currentTheme.text,
                fontFamily: "monospace",
                resize: "vertical"
              }}
              onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
              onBlur={(e) => e.target.style.borderColor = currentTheme.border}
            />

            <div style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
              alignItems: "center"
            }}>
              <button
                onClick={handleSubmit}
                disabled={loading || !nlQuery.trim()}
                style={{
                  flex: 1,
                  padding: "1rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "white",
                  background: loading || !nlQuery.trim()
                    ? "#6b7280"
                    : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading || !nlQuery.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: loading || !nlQuery.trim()
                    ? "none"
                    : "0 4px 12px rgba(59, 130, 246, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (!loading && nlQuery.trim()) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = loading || !nlQuery.trim()
                    ? "none"
                    : "0 4px 12px rgba(59, 130, 246, 0.4)";
                }}
              >
                {loading ? "⏳ Generating SQL..." : "🚀 Execute Query"}
              </button>

              {result?.sql && (
                <button
                  onClick={copySQLToClipboard}
                  style={{
                    padding: "1rem",
                    background: copiedSql ? currentTheme.success : currentTheme.secondary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    minWidth: "120px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  title="Copy SQL to clipboard"
                >
                  {copiedSql ? "✓ Copied!" : "📋 Copy SQL"}
                </button>
              )}
            </div>

            {loading && (
              <div style={{
                marginTop: "1rem",
                padding: "1rem",
                background: `${currentTheme.primary}15`,
                border: `1px solid ${currentTheme.primary}`,
                borderRadius: "8px",
                color: currentTheme.primary,
                fontSize: "0.95rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <div className="spinner" style={{
                  width: "20px",
                  height: "20px",
                  border: `3px solid ${currentTheme.primary}30`,
                  borderTop: `3px solid ${currentTheme.primary}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Generating SQL and querying database...
              </div>
            )}
          </div>

          {/* Generated SQL Display */}
          {result?.sql && (
            <div style={{
              background: currentTheme.cardBg,
              borderRadius: "12px",
              border: `1px solid ${currentTheme.border}`,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <div style={{
                padding: "1rem 1.5rem",
                background: darkMode ? "#1e293b" : "#f8fafc",
                borderBottom: `1px solid ${currentTheme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <h3 style={{
                  margin: 0,
                  color: currentTheme.success,
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ fontSize: "1.3rem" }}>✓</span>
                  Generated SQL
                </h3>
              </div>

              <pre style={{
                background: darkMode ? "#0f172a" : "#1e293b",
                color: "#10b981",
                padding: "1.5rem",
                margin: 0,
                fontSize: "1rem",
                lineHeight: "1.6",
                overflow: "auto",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {result.sql}
              </pre>
            </div>
          )}

          {/* Results */}
          {result && result.type === "success" && (
            <div style={{
              background: currentTheme.cardBg,
              borderRadius: "12px",
              border: `1px solid ${currentTheme.border}`,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{
                margin: "0 0 1.5rem 0",
                color: currentTheme.text,
                fontSize: "1.2rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span style={{ fontSize: "1.5rem" }}></span>
                Query Results
                <span style={{
                  background: currentTheme.primary,
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginLeft: "0.5rem"
                }}>
                  {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
                </span>
              </h3>

              {result.data && result.data.length > 0 ? (
                <ResultsTable
                  data={result.data}
                  columns={result.columns}
                  darkMode={darkMode}
                  theme={currentTheme}
                />
              ) : (
                <div style={{
                  padding: "4rem",
                  textAlign: "center",
                  background: darkMode ? "#1e293b" : "#f8fafc",
                  borderRadius: "8px",
                  border: `2px dashed ${currentTheme.border}`
                }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
                  <p style={{ color: currentTheme.textSecondary, margin: 0, fontSize: "1.1rem" }}>
                    No data returned from query
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {result && result.type === "error" && (
            <div style={{
              background: currentTheme.cardBg,
              borderRadius: "12px",
              border: `2px solid ${currentTheme.error}`,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
            }}>
              <h3 style={{
                margin: "0 0 1rem 0",
                color: currentTheme.error,
                fontSize: "1.1rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span style={{ fontSize: "1.3rem" }}>✗</span>
                Error
              </h3>
              <div style={{
                background: darkMode ? "#450a0a" : "#fef2f2",
                border: `1px solid ${currentTheme.error}`,
                borderRadius: "8px",
                padding: "1rem"
              }}>
                <pre style={{
                  color: currentTheme.error,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  lineHeight: "1.6"
                }}>
                  {result.message}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Query History (Right) */}
        <div style={{
          maxHeight: "calc(100vh - 130px)",
          position: "sticky",
          top: "115px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gridColumn: "span 1",
          minWidth: "280px"
        }}
        className="history-section">
          <QueryHistory
            history={queryHistory}
            onSelectQuery={(query) => setNlQuery(query)}
            onClearHistory={clearQueryHistory}
            darkMode={darkMode}
            theme={currentTheme}
          />
        </div>
        </div>
      )}

      {/* Destructive Query Warning Modal */}
      {showDeleteWarning && pendingQuery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: currentTheme.cardBg,
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            border: `2px solid ${currentTheme.error}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${currentTheme.error}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  color: currentTheme.error,
                  fontSize: '1.3rem',
                  fontWeight: '700'
                }}>
                  Destructive Operation Warning
                </h3>
                <p style={{
                  margin: '0.25rem 0 0 0',
                  color: currentTheme.textSecondary,
                  fontSize: '0.9rem'
                }}>
                  This action will modify or delete data
                </p>
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '1.5rem'
            }}>
              <p style={{
                color: currentTheme.text,
                fontSize: '1rem',
                margin: '0 0 1rem 0',
                lineHeight: '1.6'
              }}>
                The following SQL query will <strong>permanently modify or delete data</strong> from your database:
              </p>

              <div style={{
                background: darkMode ? '#1e0a0a' : '#fef2f2',
                border: `2px solid ${currentTheme.error}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <pre style={{
                  color: currentTheme.error,
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.5'
                }}>
                  {pendingQuery.sql}
                </pre>
              </div>

              <div style={{
                background: `${currentTheme.error}10`,
                border: `1px solid ${currentTheme.error}30`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  color: currentTheme.text,
                  fontSize: '0.9rem',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  <strong>⚠️ Warning:</strong> This operation cannot be undone. Please ensure you have a backup before proceeding.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '1.5rem',
              borderTop: `1px solid ${currentTheme.border}`,
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: currentTheme.text,
                  background: currentTheme.background,
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme.cardBg;
                  e.currentTarget.style.borderColor = currentTheme.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentTheme.background;
                  e.currentTarget.style.borderColor = currentTheme.border;
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  background: currentTheme.error,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 12px ${currentTheme.error}40`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${currentTheme.error}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.error}40`;
                }}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Responsive Grid Layout */
        @media (min-width: 1600px) {
          .main-grid {
            grid-template-columns: 320px minmax(600px, 1fr) 420px !important;
          }
        }

        @media (min-width: 1200px) and (max-width: 1599px) {
          .main-grid {
            grid-template-columns: 280px minmax(500px, 1fr) 380px !important;
          }
        }

        @media (min-width: 900px) and (max-width: 1199px) {
          .main-grid {
            grid-template-columns: 260px 1fr !important;
          }
          .history-section {
            grid-column: 1 / -1 !important;
            position: relative !important;
            top: 0 !important;
            max-height: 500px !important;
          }
        }

        @media (max-width: 899px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
          .schema-section,
          .query-section,
          .history-section {
            grid-column: 1 / -1 !important;
            position: relative !important;
            top: 0 !important;
            max-height: none !important;
          }
          .schema-section,
          .history-section {
            max-height: 500px !important;
          }
        }

        /* Tablet Portrait */
        @media (max-width: 768px) {
          .main-grid {
            padding: 1rem !important;
            gap: 1rem !important;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .main-grid {
            padding: 0.75rem !important;
            gap: 0.75rem !important;
          }
          .schema-section,
          .history-section {
            max-height: 400px !important;
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${currentTheme.background};
        }

        ::-webkit-scrollbar-thumb {
          background: ${currentTheme.border};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme.primary};
        }

        /* Smooth transitions for layout changes */
        .main-grid > * {
          transition: all 0.3s ease;
        }

        /* Header Responsive Styles */
        @media (max-width: 768px) {
          .app-header {
            padding: 1rem 1.5rem !important;
          }
          .app-title {
            font-size: 1.4rem !important;
          }
          .app-subtitle {
            font-size: 0.85rem !important;
          }
          .theme-label {
            display: none !important;
          }
          .theme-toggle {
            padding: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          .app-header {
            padding: 0.75rem 1rem !important;
          }
          .app-title {
            font-size: 1.2rem !important;
          }
          .app-title span:first-child {
            font-size: 1.5rem !important;
          }
          .app-subtitle {
            display: none !important;
          }
          .theme-toggle {
            padding: 0.6rem !important;
            font-size: 1.3rem !important;
          }
        }

        /* Query Textarea Responsive */
        @media (max-width: 768px) {
          .query-section textarea {
            min-height: 100px !important;
            font-size: 0.95rem !important;
          }
        }

        @media (max-width: 480px) {
          .query-section textarea {
            min-height: 80px !important;
            font-size: 0.9rem !important;
            padding: 0.75rem !important;
          }
        }

        /* Button Responsive */
        @media (max-width: 480px) {
          .query-section button {
            font-size: 0.9rem !important;
            padding: 0.75rem 1.5rem !important;
          }
        }

        /* Table Responsive */
        @media (max-width: 768px) {
          table {
            font-size: 0.85rem !important;
          }
          table th,
          table td {
            padding: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          table {
            font-size: 0.8rem !important;
          }
          table th,
          table td {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
