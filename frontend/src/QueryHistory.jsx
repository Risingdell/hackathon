import { useState } from 'react';

function QueryHistory({ history, onSelectQuery, onClearHistory, darkMode, theme }) {
  const [expanded, setExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    if (onClearHistory) {
      onClearHistory();
      setShowClearConfirm(false);
    }
  };

  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div
        style={{
          padding: '1rem 1.25rem',
          background: darkMode ? '#1e293b' : '#f8fafc',
          borderBottom: `1px solid ${theme.border}`,
          color: theme.text,
          fontSize: '1rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}></span>
          Executed Queries ({history.length})
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              padding: '0.4rem 0.75rem',
              background: theme.error,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title="Clear all query history"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '12px'
        }}>
          <div style={{
            background: theme.cardBg,
            borderRadius: '12px',
            padding: '1.5rem',
            border: `2px solid ${theme.error}`,
            maxWidth: '300px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: theme.error,
              fontSize: '1.1rem',
              fontWeight: '700'
            }}>
              Clear All History?
            </h3>
            <p style={{
              margin: '0 0 1.5rem 0',
              color: theme.textSecondary,
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              This will permanently delete all {history.length} saved queries. This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: theme.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem'
      }}>
        {history.length === 0 ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            color: theme.textSecondary,
            fontSize: '0.9rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            No queries executed yet
          </div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '0.75rem',
                background: darkMode ? '#1e293b' : '#f8fafc',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                onClick={() => setSelectedItem(selectedItem === idx ? null : idx)}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? '#334155' : '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    color: theme.textSecondary,
                    fontSize: '0.7rem'
                  }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  <span style={{
                    transform: selectedItem === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '0.8rem',
                    color: theme.textSecondary
                  }}>
                    ▼
                  </span>
                </div>
                <div style={{
                  color: theme.text,
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '0.5rem'
                }}>
                  {item.query}
                </div>
                <div style={{
                  background: darkMode ? '#0f172a' : '#1e293b',
                  color: theme.success,
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.sql}
                </div>
              </div>

              {selectedItem === idx && (
                <div style={{
                  padding: '0.75rem',
                  borderTop: `1px solid ${theme.border}`,
                  background: darkMode ? '#0f172a' : '#f1f5f9'
                }}>
                  <div style={{
                    color: theme.text,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Generated SQL:
                  </div>
                  <pre style={{
                    background: darkMode ? '#1e293b' : '#e2e8f0',
                    color: theme.success,
                    padding: '0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '0 0 0.75rem 0',
                    overflow: 'auto',
                    maxHeight: '150px'
                  }}>
                    {item.sql}
                  </pre>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectQuery(item.query);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: theme.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Re-run Query
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QueryHistory;
