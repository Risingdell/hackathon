import { useState } from 'react';

function SchemaExplorer({ schema, darkMode, theme }) {
  const [expandedTables, setExpandedTables] = useState({});

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  if (!schema || !schema.tables) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: theme.textSecondary
      }}>
        Loading schema...
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '0.5rem'
    }}>
      <div style={{
        padding: '1rem',
        marginBottom: '1rem',
        background: darkMode ? '#1e293b' : '#f8fafc',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`
      }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          color: theme.text,
          fontSize: '1.1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.3rem' }}>🗄️</span>
          Database Schema
        </h3>
        <p style={{
          margin: 0,
          color: theme.textSecondary,
          fontSize: '0.85rem'
        }}>
          {schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''} • Click to expand
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {schema.tables.map((table, idx) => (
          <div key={idx} style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            {/* Table Header */}
            <button
              onClick={() => toggleTable(table.name)}
              style={{
                width: '100%',
                padding: '1rem',
                background: darkMode
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: 'none',
                borderBottom: expandedTables[table.name] ? `1px solid ${theme.border}` : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = darkMode
                ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = darkMode
                ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}></span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    color: theme.text,
                    fontWeight: '600',
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}>
                    {table.name}
                  </div>
                  <div style={{
                    color: theme.textSecondary,
                    fontSize: '0.75rem',
                    marginTop: '0.15rem'
                  }}>
                    {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <span style={{
                transform: expandedTables[table.name] ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                fontSize: '1.1rem',
                color: theme.textSecondary
              }}>
                ▼
              </span>
            </button>

            {/* Columns List */}
            {expandedTables[table.name] && (
              <div style={{ padding: '0.5rem' }}>
                {table.columns.map((column, colIdx) => {
                  const isPK = column.primary_key;
                  const isFK = schema.relationships?.some(
                    rel => rel.source === table.name && rel.source_column === column.name
                  );

                  return (
                    <div
                      key={colIdx}
                      style={{
                        padding: '0.75rem',
                        margin: '0.25rem',
                        background: darkMode ? '#0f172a' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#1e293b' : '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? '#0f172a' : '#f8fafc'}
                    >
                      {/* Key Badge */}
                      {isPK ? (
                        <span style={{
                          background: '#f59e0b',
                          color: 'white',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '700'
                        }}>
                          PK
                        </span>
                      ) : isFK ? (
                        <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '700'
                        }}>
                          FK
                        </span>
                      ) : (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: theme.textSecondary,
                          marginLeft: '0.25rem'
                        }} />
                      )}

                      {/* Column Name */}
                      <span style={{
                        flex: 1,
                        color: theme.text,
                        fontFamily: 'monospace',
                        fontWeight: '500'
                      }}>
                        {column.name}
                      </span>

                      {/* Type */}
                      <span style={{
                        color: theme.textSecondary,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        background: darkMode ? '#1e293b' : '#e2e8f0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {column.type}
                      </span>

                      {/* NOT NULL */}
                      {!column.nullable && (
                        <span style={{
                          background: '#ef4444',
                          color: 'white',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: '700'
                        }}>
                          NOT NULL
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Relationships Summary */}
      {schema.relationships && schema.relationships.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: darkMode ? '#1e293b' : '#f8fafc',
          border: `1px solid ${theme.border}`,
          borderRadius: '8px'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            color: theme.text,
            fontSize: '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔗</span>
            Relationships
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {schema.relationships.map((rel, idx) => (
              <div key={idx} style={{
                padding: '0.5rem',
                background: theme.cardBg,
                border: `1px solid ${theme.primary}`,
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: theme.text,
                fontFamily: 'monospace'
              }}>
                <strong>{rel.source}</strong>.{rel.source_column} → <strong>{rel.target}</strong>.{rel.target_column}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemaExplorer;
