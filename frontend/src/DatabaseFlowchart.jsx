import { useState, useRef, useEffect } from 'react';

function DatabaseFlowchart({ schema, darkMode, theme }) {
  const [tableStates, setTableStates] = useState({});
  const [draggingTable, setDraggingTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showRelationships, setShowRelationships] = useState(true);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Initialize table positions and states
  useEffect(() => {
    if (!schema?.tables) return;

    const initialStates = {};
    const tableWidth = 300;
    const tableHeight = 60;
    const horizontalSpacing = 200;
    const verticalSpacing = 200;
    const cols = Math.min(Math.ceil(Math.sqrt(schema.tables.length)), 3);

    schema.tables.forEach((table, index) => {
      if (!tableStates[table.name]) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        initialStates[table.name] = {
          x: 100 + col * (tableWidth + horizontalSpacing),
          y: 100 + row * (tableHeight + verticalSpacing),
          minimized: false,
          maximized: false,
          zIndex: index
        };
      }
    });

    setTableStates(prev => ({ ...prev, ...initialStates }));
  }, [schema]);

  const handleMouseDown = (e, tableName) => {
    if (e.target.closest('.table-action-btn')) return;

    setDraggingTable(tableName);
    const tableState = tableStates[tableName];
    setDragOffset({
      x: e.clientX - tableState.x,
      y: e.clientY - tableState.y
    });

    // Bring to front
    const maxZ = Math.max(...Object.values(tableStates).map(s => s.zIndex), 0);
    setTableStates(prev => ({
      ...prev,
      [tableName]: { ...prev[tableName], zIndex: maxZ + 1 }
    }));
  };

  const handleMouseMove = (e) => {
    if (!draggingTable) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setTableStates(prev => ({
      ...prev,
      [draggingTable]: {
        ...prev[draggingTable],
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      }
    }));
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

  useEffect(() => {
    if (draggingTable) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingTable, dragOffset]);

  const toggleMinimize = (tableName) => {
    setTableStates(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        minimized: !prev[tableName].minimized,
        maximized: false
      }
    }));
  };

  const toggleMaximize = (tableName) => {
    setTableStates(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        maximized: !prev[tableName].maximized,
        minimized: false
      }
    }));
  };

  const filteredTables = schema?.tables?.filter(table => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return table.name.toLowerCase().includes(query) ||
           table.columns?.some(col =>
             col.name.toLowerCase().includes(query) ||
             col.type.toLowerCase().includes(query)
           );
  }) || [];

  const resetLayout = () => {
    const tableWidth = 300;
    const tableHeight = 60;
    const horizontalSpacing = 200;
    const verticalSpacing = 200;
    const cols = Math.min(Math.ceil(Math.sqrt(schema.tables.length)), 3);

    const newStates = {};
    schema.tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newStates[table.name] = {
        x: 100 + col * (tableWidth + horizontalSpacing),
        y: 100 + row * (tableHeight + verticalSpacing),
        minimized: false,
        maximized: false,
        zIndex: index
      };
    });
    setTableStates(newStates);
  };

  const minimizeAll = () => {
    setTableStates(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], minimized: true, maximized: false };
      });
      return updated;
    });
  };

  const expandAll = () => {
    setTableStates(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], minimized: false, maximized: false };
      });
      return updated;
    });
  };

  // Helper function to get table dimensions
  const getTableDimensions = (tableName) => {
    const state = tableStates[tableName];
    if (!state) return null;

    const width = state.maximized ? 600 : 300;
    const headerHeight = 50;

    return {
      x: state.x,
      y: state.y,
      width: width,
      height: headerHeight,
      centerX: state.x + width / 2,
      centerY: state.y + headerHeight / 2,
      bottom: state.y + headerHeight,
      top: state.y
    };
  };

  // Force re-render when dragging to update SVG lines
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (draggingTable) {
      forceUpdate({});
    }
  }, [tableStates, draggingTable]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme.background,
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '1rem 1.5rem',
        background: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          margin: 0,
          color: theme.text,
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          Database Schema
        </h2>

        <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '350px' }}>
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.textSecondary
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search tables, columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              fontSize: '0.875rem',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              background: theme.background,
              color: theme.text,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.primary}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            onClick={() => setShowRelationships(!showRelationships)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: showRelationships ? theme.accent : 'transparent',
              color: showRelationships ? 'white' : theme.text,
              border: `1px solid ${showRelationships ? theme.accent : theme.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showRelationships) {
                e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRelationships) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            🔗 Relations
          </button>

          <button
            onClick={expandAll}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Expand All
          </button>

          <button
            onClick={minimizeAll}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: theme.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Minimize All
          </button>

          <button
            onClick={resetLayout}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: theme.success,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Reset Layout
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '0.5rem 1.5rem',
        background: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        gap: '1.5rem',
        fontSize: '0.813rem',
        color: theme.textSecondary
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ color: theme.warning, fontWeight: 'bold' }}>●</span>
          <span>Primary Key</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ color: theme.error, fontWeight: 'bold' }}>*</span>
          <span>NOT NULL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>{schema?.tables?.length || 0} Tables</span>
        </div>
        {searchQuery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: theme.success, fontWeight: 'bold' }}>
              {filteredTables.length} Match{filteredTables.length !== 1 ? 'es' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          background: darkMode ? theme.background : '#f8fafc',
          cursor: draggingTable ? 'grabbing' : 'default'
        }}
      >
        {/* SVG Layer for Relationships */}
        {showRelationships && schema?.relationships && (
          <svg
            ref={svgRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={theme.primary}
                  opacity="0.6"
                />
              </marker>
            </defs>
            {schema.relationships.map((rel, idx) => {
              const source = getTableDimensions(rel.source);
              const target = getTableDimensions(rel.target);

              if (!source || !target) return null;

              // Calculate connection points
              const startX = source.centerX;
              const startY = source.bottom;
              const endX = target.centerX;
              const endY = target.top;

              // Create curved path
              const midY = (startY + endY) / 2;
              const path = `M ${startX} ${startY} Q ${startX} ${midY}, ${(startX + endX) / 2} ${midY} T ${endX} ${endY}`;

              return (
                <g key={`${rel.source}-${rel.target}-${idx}`}>
                  <path
                    d={path}
                    stroke={theme.primary}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    opacity="0.6"
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Relationship label */}
                  <text
                    x={(startX + endX) / 2}
                    y={midY}
                    fill={theme.textSecondary}
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    style={{
                      userSelect: 'none',
                      background: theme.cardBg,
                      padding: '2px 4px'
                    }}
                  >
                    {rel.type || 'FK'}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Floating Info */}
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          fontSize: '0.75rem',
          color: theme.textSecondary,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '1rem',
          zIndex: 1000
        }}>
          <span>🖱️ Drag: Move table</span>
          <span>📏 Click icons: Minimize/Maximize</span>
        </div>

        {/* Tables */}
        {filteredTables.map((table) => {
          const state = tableStates[table.name] || { x: 0, y: 0, minimized: false, maximized: false, zIndex: 0 };
          const isHighlighted = searchQuery.trim() && filteredTables.includes(table);

          return (
            <div
              key={table.name}
              style={{
                position: 'absolute',
                left: `${state.x}px`,
                top: `${state.y}px`,
                width: state.maximized ? '600px' : '300px',
                background: theme.cardBg,
                border: `2px solid ${isHighlighted ? theme.success : theme.border}`,
                borderRadius: '10px',
                boxShadow: isHighlighted
                  ? `0 8px 24px ${theme.success}40`
                  : '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: state.zIndex,
                transition: 'width 0.3s ease, box-shadow 0.2s ease',
                cursor: draggingTable === table.name ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, table.name)}
            >
              {/* Header */}
              <div style={{
                padding: '0.75rem 1rem',
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                borderRadius: '8px 8px 0 0',
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🗂️</span>
                  <span>{table.name}</span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {table.columns?.length || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="table-action-btn"
                    onClick={() => toggleMinimize(table.name)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    title="Minimize"
                  >
                    −
                  </button>
                  <button
                    className="table-action-btn"
                    onClick={() => toggleMaximize(table.name)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    title={state.maximized ? "Restore" : "Maximize"}
                  >
                    {state.maximized ? '◱' : '□'}
                  </button>
                </div>
              </div>

              {/* Columns */}
              {!state.minimized && (
                <div style={{
                  padding: '0.5rem',
                  maxHeight: state.maximized ? '600px' : '400px',
                  overflowY: 'auto'
                }}>
                  {table.columns?.map((col, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: idx % 2 === 0
                          ? (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                          : 'transparent',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: theme.text,
                          fontWeight: '500',
                          fontFamily: 'monospace'
                        }}>
                          {col.name}
                        </div>
                        <div style={{
                          color: theme.textSecondary,
                          fontSize: '0.75rem',
                          marginTop: '0.125rem'
                        }}>
                          {col.type.toUpperCase()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {col.primary_key && (
                          <span
                            style={{
                              color: theme.warning,
                              fontSize: '1rem',
                              fontWeight: 'bold'
                            }}
                            title="Primary Key"
                          >
                            ●
                          </span>
                        )}
                        {!col.nullable && (
                          <span
                            style={{
                              color: theme.error,
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                            title="NOT NULL"
                          >
                            *
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        div::-webkit-scrollbar-track {
          background: ${theme.background};
        }

        div::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 4px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: ${theme.primary};
        }
      `}</style>
    </div>
  );
}

export default DatabaseFlowchart;
