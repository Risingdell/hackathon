// frontend/src/App.jsx
import { useState, useEffect } from "react";
import './App.css';
import DatabaseVisualizer from './DatabaseVisualizer';

function App() {
  const [nlQuery, setNlQuery] = useState("");
  const [result, setResult] = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://localhost:5001/health");
        if (response.ok) {
          setBackendReady(true);
        }
      } catch (err) {
        console.error("Backend not ready yet...", err);
        setTimeout(checkBackend, 2000);
      }
    };
    checkBackend();
  }, []);

  // const handleSubmit = async () => {
  //   try {
  //     const response = await fetch("http://localhost:5001/generate-sql", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ query: nlQuery }), // Send nlQuery as 'query'
  //     });

  //     const data = await response.json();
  //     setResult(data.data); // PostgreSQL results returned from backend
  //   } catch (err) {
  //     console.error(err);
  //     setResult([{ error: err.message }]);
  //   }
  // };
  const handleSubmit = async () => {
    setLoading(true); // Show loading while generating SQL
    setResult(null); // Clear previous results

    try {
      const response = await fetch("http://localhost:5001/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nlQuery,
          include_schema: true // Include database schema for better SQL generation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult({
          type: "success",
          sql: data.sql,
          query: nlQuery,
          data: data.data || [],
          columns: data.columns || [],
          rowCount: data.row_count || 0
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


  // Theme colors
  const theme = {
    dark: {
      background: "#0a0e27",
      cardBg: "#1a1f3a",
      text: "#e2e8f0",
      textSecondary: "#94a3b8",
      primary: "#3b82f6",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      border: "#2d3548"
    },
    light: {
      background: "#f1f5f9",
      cardBg: "#ffffff",
      text: "#1e293b",
      textSecondary: "#64748b",
      primary: "#2563eb",
      secondary: "#4f46e5",
      accent: "#7c3aed",
      border: "#e2e8f0"
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
          padding: "2rem 3rem",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
          <h3 style={{ color: currentTheme.text, margin: 0 }}>Connecting to backend...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: currentTheme.background,
      padding: "2rem 1rem",
      transition: "background 0.3s ease"
    }}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 1000,
          background: currentTheme.cardBg,
          border: `2px solid ${currentTheme.border}`,
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1.5rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(15deg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
        }}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div style={{
        display: "flex",
        gap: "2rem",
        width: "100%",
        margin: "0 auto",
        alignItems: "flex-start"
      }}>
        {/* Database Visualization Panel - 2/5th of the page */}
        <div style={{
          width: "40%",
          flexShrink: 0
        }}>
          <div style={{
            background: currentTheme.cardBg,
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: darkMode
              ? "0 10px 40px rgba(0,0,0,0.5)"
              : "0 10px 40px rgba(0,0,0,0.1)",
            height: "calc(100vh - 4rem)",
            position: "sticky",
            top: "2rem",
            border: `1px solid ${currentTheme.border}`,
            transition: "all 0.3s ease"
          }}>
            <DatabaseVisualizer darkMode={darkMode} theme={currentTheme} />
          </div>
        </div>

        {/* Main Content Panel - 3/5th of the page */}
        <div style={{
          flex: 1
        }}>
        {/* Header Section */}
        <div style={{
          background: currentTheme.cardBg,
          borderRadius: "16px",
          padding: "2.5rem",
          marginBottom: "2rem",
          boxShadow: darkMode
            ? "0 10px 40px rgba(0,0,0,0.5)"
            : "0 10px 40px rgba(0,0,0,0.1)",
          border: `1px solid ${currentTheme.border}`,
          transition: "all 0.3s ease"
        }}>
          <h1 style={{
            margin: "0 0 0.5rem 0",
            fontSize: "2.5rem",
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            🤖 Natural Language to SQL
          </h1>
          <p style={{
            margin: 0,
            color: currentTheme.textSecondary,
            fontSize: "1.1rem"
          }}>
            Ask questions in plain English and get SQL queries with live results
          </p>
        </div>

        {/* Query Input Section */}
        <div style={{
          background: currentTheme.cardBg,
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: darkMode
            ? "0 10px 40px rgba(0,0,0,0.5)"
            : "0 10px 40px rgba(0,0,0,0.1)",
          border: `1px solid ${currentTheme.border}`,
          transition: "all 0.3s ease"
        }}>
          <label style={{
            display: "block",
            marginBottom: "1rem",
            color: currentTheme.text,
            fontSize: "1.1rem",
            fontWeight: "600"
          }}>
            Enter your query:
          </label>
          <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && nlQuery.trim() && handleSubmit()}
              placeholder="e.g., Show all products with price greater than 500"
              disabled={loading}
              style={{
                flex: 1,
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                border: `2px solid ${currentTheme.border}`,
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s ease",
                backgroundColor: loading ? currentTheme.background : currentTheme.cardBg,
                color: currentTheme.text
              }}
              onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
              onBlur={(e) => e.target.style.borderColor = currentTheme.border}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !nlQuery.trim()}
              style={{
                padding: "1rem 2.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                color: "white",
                background: loading || !nlQuery.trim()
                  ? "#6b7280"
                  : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                border: "none",
                borderRadius: "12px",
                cursor: loading || !nlQuery.trim() ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: loading || !nlQuery.trim()
                  ? "none"
                  : `0 4px 15px ${darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(102, 126, 234, 0.4)'}`
              }}
              onMouseEnter={(e) => {
                if (!loading && nlQuery.trim()) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = `0 6px 20px ${darkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(102, 126, 234, 0.6)'}`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = loading || !nlQuery.trim()
                  ? "none"
                  : `0 4px 15px ${darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(102, 126, 234, 0.4)'}`;
              }}
            >
              {loading ? "⏳ Processing..." : "🚀 Execute"}
            </button>
          </div>
          {loading && (
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: darkMode ? "rgba(59, 130, 246, 0.1)" : "#f0f7ff",
              border: `1px solid ${currentTheme.primary}`,
              borderRadius: "8px",
              color: currentTheme.primary,
              fontSize: "0.95rem"
            }}>
              ⚡ Generating SQL and querying database...
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div style={{
            background: currentTheme.cardBg,
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: darkMode
              ? "0 10px 40px rgba(0,0,0,0.5)"
              : "0 10px 40px rgba(0,0,0,0.1)",
            border: `1px solid ${currentTheme.border}`,
            transition: "all 0.3s ease"
          }}>
            {result.type === "success" ? (
              <>
                {/* SQL Query Display */}
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{
                    margin: "0 0 1rem 0",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>✓</span>
                    Generated SQL Query
                  </h3>
                  <pre style={{
                    background: darkMode ? "#0f172a" : "#1e293b",
                    color: "#10b981",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    overflow: "auto",
                    margin: 0,
                    border: "2px solid #10b981",
                    lineHeight: "1.6"
                  }}>
                    {result.sql}
                  </pre>
                </div>

                {/* Query Results */}
                <div>
                  <h3 style={{
                    margin: "0 0 1rem 0",
                    color: currentTheme.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>📊</span>
                    Query Results
                    <span style={{
                      background: currentTheme.primary,
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.9rem",
                      fontWeight: "600"
                    }}>
                      {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
                    </span>
                  </h3>

                  {result.data && result.data.length > 0 ? (
                    <div style={{
                      overflowX: "auto",
                      borderRadius: "12px",
                      border: `2px solid ${currentTheme.border}`
                    }}>
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse"
                      }}>
                        <thead>
                          <tr style={{
                            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                          }}>
                            {result.columns.map((col, idx) => (
                              <th key={idx} style={{
                                padding: "1rem",
                                textAlign: "left",
                                color: "white",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.data.map((row, rowIdx) => (
                            <tr key={rowIdx} style={{
                              background: rowIdx % 2 === 0
                                ? (darkMode ? "#1e293b" : "#f9fafb")
                                : currentTheme.cardBg,
                              transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "#334155" : "#f0f7ff"}
                            onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0
                              ? (darkMode ? "#1e293b" : "#f9fafb")
                              : currentTheme.cardBg}
                            >
                              {result.columns.map((col, colIdx) => (
                                <td key={colIdx} style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${currentTheme.border}`,
                                  color: currentTheme.text,
                                  fontSize: "0.95rem"
                                }}>
                                  {row[col] !== null && row[col] !== undefined
                                    ? String(row[col])
                                    : <span style={{ color: currentTheme.textSecondary, fontStyle: "italic" }}>NULL</span>
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{
                      padding: "3rem",
                      textAlign: "center",
                      background: darkMode ? "#1e293b" : "#f9fafb",
                      borderRadius: "12px",
                      border: `2px dashed ${currentTheme.border}`
                    }}>
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                      <p style={{ color: currentTheme.textSecondary, margin: 0, fontSize: "1.1rem" }}>
                        No data returned from query
                      </p>
                    </div>
                  )}

                  {/* Query Info Footer */}
                  <div style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    background: darkMode ? "#1e293b" : "#f9fafb",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: currentTheme.textSecondary,
                    border: `1px solid ${currentTheme.border}`
                  }}>
                    <strong style={{ color: currentTheme.text }}>Your question:</strong> "{result.query}"
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Error Display */}
                <h3 style={{
                  margin: "0 0 1rem 0",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ fontSize: "1.5rem" }}>✗</span>
                  Error
                </h3>
                <div style={{
                  background: darkMode ? "#450a0a" : "#fef2f2",
                  border: "2px solid #ef4444",
                  borderRadius: "12px",
                  padding: "1.5rem"
                }}>
                  <pre style={{
                    color: "#ef4444",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    fontSize: "0.95rem"
                  }}>
                    {result.message}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;
