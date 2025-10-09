import { useState, useEffect } from 'react';

function DatabaseVisualizer({ darkMode, theme }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('http://localhost:5001/schema');
      const data = await response.json();

      if (data.success) {
        setSchema(data);
      } else {
        setError('Failed to fetch schema');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if column is a foreign key
  const isForeignKey = (tableName, columnName) => {
    if (!schema?.relationships) return false;
    return schema.relationships.some(
      rel => rel.source === tableName && rel.source_column === columnName
    );
  };

  // Helper to get foreign key relationship
  const getForeignKeyTarget = (tableName, columnName) => {
    if (!schema?.relationships) return null;
    return schema.relationships.find(
      rel => rel.source === tableName && rel.source_column === columnName
    );
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>Loading schema...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        background: darkMode ? '#450a0a' : '#fef2f2',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        color: '#ef4444'
      }}>
        Error loading schema: {error}
      </div>
    );
  }

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: theme.textSecondary
      }}>
        No tables found in database
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '1rem',
      background: darkMode ? '#0f172a' : '#f8fafc'
    }}>
      {/* Database Root Node */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Level 1: Database */}
        <div style={{
          background: darkMode
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
            : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          padding: '1rem 2rem',
          borderRadius: '12px',
          color: 'white',
          fontWeight: '700',
          fontSize: '1.2rem',
          boxShadow: darkMode
            ? '0 8px 16px rgba(0, 0, 0, 0.5)'
            : '0 8px 16px rgba(30, 58, 138, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: darkMode ? '3px solid #4c1d95' : '3px solid #1e40af'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🗄️</span>
          DATABASE SCHEMA
        </div>

        {/* Connector Line */}
        <div style={{
          width: '3px',
          height: '30px',
          background: darkMode
            ? 'linear-gradient(to bottom, #4c1d95, #6366f1)'
            : 'linear-gradient(to bottom, #3b82f6, #667eea)',
          borderRadius: '2px'
        }} />

        {/* Level 2: Tables Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          width: '100%',
          alignItems: 'center'
        }}>
          {schema.tables.map((table, tableIdx) => (
            <div key={tableIdx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '100%'
            }}>
              {/* Table Node */}
              <div style={{
                background: darkMode
                  ? 'linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                boxShadow: darkMode
                  ? '0 6px 12px rgba(76, 29, 149, 0.5)'
                  : '0 6px 12px rgba(79, 70, 229, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: darkMode ? '3px solid #5b21b6' : '3px solid #6366f1',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 8px 16px rgba(76, 29, 149, 0.6)'
                  : '0 8px 16px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = darkMode
                  ? '0 6px 12px rgba(76, 29, 149, 0.5)'
                  : '0 6px 12px rgba(79, 70, 229, 0.3)';
              }}>
                <span style={{ fontSize: '1.4rem' }}>📊</span>
                {table.name.toUpperCase()}
              </div>

              {/* Connector Line to Attributes */}
              <div style={{
                width: '3px',
                height: '20px',
                background: darkMode
                  ? 'linear-gradient(to bottom, #6b21a8, #3b82f6)'
                  : 'linear-gradient(to bottom, #7c3aed, #3b82f6)',
                borderRadius: '2px'
              }} />

              {/* Level 3: Attributes Container */}
              <div style={{
                background: theme.cardBg,
                border: `3px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '1rem',
                width: '95%',
                boxShadow: darkMode
                  ? '0 4px 8px rgba(0,0,0,0.3)'
                  : '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${theme.border}`,
                  fontWeight: '600',
                  color: theme.text,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Attributes
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {table.columns.map((column, colIdx) => {
                    const isPK = column.primary_key;
                    const isFK = isForeignKey(table.name, column.name);
                    const fkTarget = getForeignKeyTarget(table.name, column.name);

                    // Determine background color based on key type
                    let bgColor, borderColor, textColor;

                    if (isPK) {
                      // Yellow/Amber for Primary Key
                      bgColor = darkMode ? '#451a03' : '#fef3c7';
                      borderColor = '#f59e0b';
                      textColor = darkMode ? '#fbbf24' : '#92400e';
                    } else if (isFK) {
                      // Blue for Foreign Key
                      bgColor = darkMode ? '#172554' : '#dbeafe';
                      borderColor = '#3b82f6';
                      textColor = darkMode ? '#60a5fa' : '#1e40af';
                    } else {
                      // Regular attribute
                      bgColor = darkMode ? '#1e293b' : '#f9fafb';
                      borderColor = theme.border;
                      textColor = theme.text;
                    }

                    return (
                      <div key={colIdx}>
                        <div style={{
                          padding: '0.6rem 0.75rem',
                          background: bgColor,
                          border: `2px solid ${borderColor}`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                          {/* Key Type Icon & Label */}
                          {isPK && (
                            <span style={{
                              background: '#f59e0b',
                              color: 'white',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              🔑 PK
                            </span>
                          )}
                          {isFK && !isPK && (
                            <span style={{
                              background: '#3b82f6',
                              color: 'white',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              🔗 FK
                            </span>
                          )}
                          {!isPK && !isFK && (
                            <span style={{
                              width: '6px',
                              height: '6px',
                              background: '#9ca3af',
                              borderRadius: '50%',
                              marginLeft: '0.25rem'
                            }} />
                          )}

                          {/* Column Name */}
                          <span style={{
                            fontWeight: isPK || isFK ? '600' : '500',
                            color: textColor,
                            flex: 1,
                            fontFamily: 'monospace'
                          }}>
                            {column.name}
                          </span>

                          {/* Column Type */}
                          <span style={{
                            background: isPK || isFK
                              ? (darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)')
                              : (darkMode ? '#0f172a' : '#e5e7eb'),
                            color: darkMode ? '#94a3b8' : '#6b7280',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            fontWeight: '600'
                          }}>
                            {column.type}
                          </span>

                          {/* NOT NULL Badge */}
                          {!column.nullable && (
                            <span style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: '700'
                            }}>
                              NOT NULL
                            </span>
                          )}
                        </div>

                        {/* Foreign Key Relationship Arrow */}
                        {isFK && fkTarget && (
                          <div style={{
                            marginTop: '0.25rem',
                            marginLeft: '2rem',
                            padding: '0.35rem 0.6rem',
                            background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
                            border: '1px dashed #3b82f6',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: darkMode ? '#60a5fa' : '#1e40af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}>
                            <span style={{ fontSize: '0.9rem' }}>↪</span>
                            References: <strong>{fkTarget.target}</strong>.{fkTarget.target_column}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Separator between tables */}
              {tableIdx < schema.tables.length - 1 && (
                <div style={{
                  width: '3px',
                  height: '25px',
                  background: darkMode
                    ? 'linear-gradient(to bottom, #3b82f6, #4c1d95)'
                    : 'linear-gradient(to bottom, #3b82f6, #7c3aed)',
                  borderRadius: '2px',
                  marginTop: '0.5rem'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '1.5rem',
          background: theme.cardBg,
          border: `2px solid ${theme.border}`,
          borderRadius: '10px',
          padding: '1rem',
          width: '95%',
          boxShadow: darkMode
            ? '0 2px 4px rgba(0,0,0,0.3)'
            : '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: theme.text,
            fontSize: '0.9rem'
          }}>
            🎨 Legend
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                background: '#f59e0b',
                color: 'white',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontWeight: '700',
                fontSize: '0.7rem'
              }}>🔑 PK</span>
              <span style={{ color: theme.textSecondary }}>Primary Key</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                background: '#3b82f6',
                color: 'white',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontWeight: '700',
                fontSize: '0.7rem'
              }}>🔗 FK</span>
              <span style={{ color: theme.textSecondary }}>Foreign Key</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                background: '#ef4444',
                color: 'white',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontWeight: '700',
                fontSize: '0.7rem'
              }}>NOT NULL</span>
              <span style={{ color: theme.textSecondary }}>Required Field</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseVisualizer;
