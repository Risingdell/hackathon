import { useEffect, useRef, useState } from 'react';

function DatabaseFlowchart({ schema, darkMode, theme }) {
  const canvasRef = useRef(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [hoveredTable, setHoveredTable] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contentBounds, setContentBounds] = useState({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 });
  const [tablePositions, setTablePositions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTables, setHighlightedTables] = useState(new Set());
  const [showRelationships, setShowRelationships] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  // Search functionality
  useEffect(() => {
    if (!schema?.tables) return;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matches = new Set();

      schema.tables.forEach(table => {
        if (table.name.toLowerCase().includes(query)) {
          matches.add(table.name);
        }
        table.columns?.forEach(col => {
          if (col.name.toLowerCase().includes(query) || col.type.toLowerCase().includes(query)) {
            matches.add(table.name);
          }
        });
      });

      setHighlightedTables(matches);
    } else {
      setHighlightedTables(new Set());
    }
  }, [searchQuery, schema]);

  useEffect(() => {
    if (!schema || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    drawDatabase(ctx, schema, rect.width, rect.height);

    ctx.restore();
  }, [schema, darkMode, theme, zoom, pan, selectedTable, hoveredTable, highlightedTables, showRelationships]);

  const drawDatabase = (ctx, schema, canvasWidth, canvasHeight) => {
    if (!schema?.tables) return;

    const tables = schema.tables;
    const relationships = schema.relationships || [];

    const tableWidth = 280;
    const tableHeight = 50;
    const horizontalSpacing = 180;
    const verticalSpacing = 160;
    const cols = Math.min(Math.ceil(Math.sqrt(tables.length)), 4);

    const totalWidth = cols * (tableWidth + horizontalSpacing);
    const startX = Math.max(100, (canvasWidth / zoom - totalWidth) / 2);
    const startY = 80;

    const positions = {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (tableWidth + horizontalSpacing);
      const y = startY + row * (tableHeight + verticalSpacing);
      positions[table.name] = { x, y, width: tableWidth, height: tableHeight, table };

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + tableWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + 200);
    });

    setTablePositions(positions);
    setContentBounds({ minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 });

    if (showRelationships) {
      relationships.forEach(rel => {
        const source = positions[rel.source];
        const target = positions[rel.target];
        if (source && target) {
          const isHighlighted = selectedTable === rel.source || selectedTable === rel.target;
          drawRelationship(ctx, source, target, rel, darkMode, theme, isHighlighted);
        }
      });
    }

    tables.forEach((table) => {
      const pos = positions[table.name];
      const isSelected = selectedTable === table.name;
      const isHovered = hoveredTable === table.name;
      const isHighlighted = highlightedTables.has(table.name);
      const actualHeight = drawTable(ctx, table, pos.x, pos.y, tableWidth, darkMode, theme, isSelected, isHovered, isHighlighted);
      positions[table.name].height = actualHeight;
    });
  };

  const drawTable = (ctx, table, x, y, width, darkMode, theme, isSelected, isHovered, isHighlighted) => {
    const headerHeight = 50;
    const rowHeight = 28;
    const columnCount = table.columns?.length || 0;
    const totalHeight = headerHeight + (columnCount * rowHeight);

    // Shadow
    if (isSelected || isHovered) {
      ctx.shadowColor = isSelected ? theme.accent : theme.primary;
      ctx.shadowBlur = isSelected ? 20 : 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
    }

    // Border
    if (isHighlighted) {
      ctx.strokeStyle = theme.success;
      ctx.lineWidth = 3;
    } else if (isSelected) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
    } else if (isHovered) {
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = darkMode ? theme.border : '#e2e8f0';
      ctx.lineWidth = 1;
    }

    // Card background
    ctx.fillStyle = darkMode ? theme.cardBg : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, width, totalHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Header
    const gradient = ctx.createLinearGradient(x, y, x, y + headerHeight);
    if (isSelected || isHighlighted) {
      gradient.addColorStop(0, theme.primary);
      gradient.addColorStop(1, theme.accent);
    } else {
      gradient.addColorStop(0, darkMode ? '#334155' : '#64748b');
      gradient.addColorStop(1, darkMode ? '#1e293b' : '#475569');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, headerHeight, [8, 8, 0, 0]);
    ctx.fill();

    // Table name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(table.name, x + 15, y + 30);

    // Column count badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    const badgeText = `${columnCount}`;
    ctx.font = 'bold 11px sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width;
    ctx.beginPath();
    ctx.roundRect(x + width - badgeWidth - 25, y + 15, badgeWidth + 16, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, x + width - badgeWidth / 2 - 17, y + 28);

    // Columns
    ctx.font = '13px "SF Mono", "Monaco", "Consolas", monospace';
    table.columns?.forEach((col, idx) => {
      const rowY = y + headerHeight + (idx * rowHeight);

      // Alternating rows
      if (idx % 2 === 1) {
        ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(x + 1, rowY, width - 2, rowHeight);
      }

      // Column name
      ctx.fillStyle = darkMode ? theme.text : '#1e293b';
      ctx.textAlign = 'left';
      ctx.font = '13px "SF Mono", "Monaco", "Consolas", monospace';
      ctx.fillText(col.name, x + 15, rowY + 18);

      // Type
      ctx.fillStyle = darkMode ? theme.textSecondary : '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(col.type.toUpperCase(), x + 15, rowY + 18 + 12);

      // Indicators
      let indicatorX = x + width - 15;

      if (col.primary_key) {
        ctx.fillStyle = theme.warning;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('●', indicatorX, rowY + 16);
        indicatorX -= 20;
      }

      if (!col.nullable) {
        ctx.fillStyle = theme.error;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('*', indicatorX, rowY + 16);
      }

      ctx.font = '13px "SF Mono", "Monaco", "Consolas", monospace';
    });

    return totalHeight;
  };

  const drawRelationship = (ctx, source, target, rel, darkMode, theme, isHighlighted) => {
    const startX = source.x + source.width / 2;
    const startY = source.y + source.height;
    const endX = target.x + target.width / 2;
    const endY = target.y;

    ctx.strokeStyle = isHighlighted ? theme.accent : (darkMode ? theme.primary + '80' : theme.secondary + '80');
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    ctx.setLineDash(isHighlighted ? [6, 3] : []);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const controlPointOffset = Math.abs(endY - startY) / 2;
    ctx.bezierCurveTo(
      startX, startY + controlPointOffset,
      endX, endY - controlPointOffset,
      endX, endY
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize / 2, endY - arrowSize);
    ctx.lineTo(endX + arrowSize / 2, endY - arrowSize);
    ctx.closePath();
    ctx.fillStyle = isHighlighted ? theme.accent : (darkMode ? theme.primary + '80' : theme.secondary + '80');
    ctx.fill();
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let clickedTable = null;
    Object.entries(tablePositions).forEach(([name, pos]) => {
      if (mouseX >= pos.x && mouseX <= pos.x + pos.width &&
          mouseY >= pos.y && mouseY <= pos.y + pos.height) {
        clickedTable = name;
      }
    });

    setSelectedTable(clickedTable);
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging) {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      setPan({ x: newPanX, y: newPanY });
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      let hoveredName = null;
      Object.entries(tablePositions).forEach(([name, pos]) => {
        if (mouseX >= pos.x && mouseX <= pos.x + pos.width &&
            mouseY >= pos.y && mouseY <= pos.y + pos.height) {
          hoveredName = name;
        }
      });

      setHoveredTable(hoveredName);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.3), 2.5);

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
      const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

      setPan({ x: newPanX, y: newPanY });
    }

    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
    setSelectedTable(null);
  };

  const fitToScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contentBounds) return;

    const rect = canvas.getBoundingClientRect();
    const padding = 80;

    const contentWidth = contentBounds.maxX - contentBounds.minX;
    const contentHeight = contentBounds.maxY - contentBounds.minY;

    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.2);

    const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
    const centerY = (contentBounds.minY + contentBounds.maxY) / 2;

    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom
    });
    setZoom(newZoom);
  };

  const exportAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `database-schema-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  useEffect(() => {
    fitToScreen();
  }, [schema]);

  const styles = {
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: darkMode ? theme.background : '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    toolbar: {
      padding: '0.75rem 1.25rem',
      background: darkMode ? theme.cardBg : '#ffffff',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
    },
    title: {
      margin: 0,
      color: theme.text,
      fontSize: '1.1rem',
      fontWeight: '600',
      letterSpacing: '-0.01em'
    },
    searchContainer: {
      flex: '1 1 250px',
      maxWidth: '350px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      padding: '0.5rem 0.75rem 0.5rem 2.25rem',
      fontSize: '0.875rem',
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      background: darkMode ? theme.background : '#f8fafc',
      color: theme.text,
      outline: 'none',
      transition: 'all 0.2s'
    },
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.textSecondary,
      pointerEvents: 'none',
      fontSize: '1rem'
    },
    controls: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center'
    },
    button: {
      padding: '0.5rem 0.875rem',
      fontSize: '0.813rem',
      fontWeight: '500',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
      whiteSpace: 'nowrap'
    },
    iconButton: {
      padding: '0.5rem',
      fontSize: '1.125rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: 'transparent',
      color: theme.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '36px'
    },
    zoomDisplay: {
      fontSize: '0.813rem',
      fontWeight: '500',
      color: theme.textSecondary,
      minWidth: '45px',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums'
    },
    statusBar: {
      padding: '0.5rem 1.25rem',
      background: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      gap: '1.5rem',
      fontSize: '0.813rem',
      color: theme.textSecondary,
      backdropFilter: 'blur(8px)'
    },
    statusItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem'
    },
    canvasWrapper: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative'
    },
    canvas: {
      width: '100%',
      height: '100%'
    },
    floatingInfo: {
      position: 'absolute',
      bottom: '1rem',
      left: '1rem',
      background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      padding: '0.625rem 0.875rem',
      borderRadius: '8px',
      border: `1px solid ${theme.border}`,
      fontSize: '0.75rem',
      color: theme.textSecondary,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '1rem'
    },
    selectedInfo: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: `2px solid ${theme.accent}`,
      fontSize: '0.875rem',
      color: theme.text,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '250px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <h2 style={styles.title}>Database Schema</h2>

        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search tables, columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => e.target.style.borderColor = theme.primary}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />
        </div>

        <div style={styles.controls}>
          <button
            onClick={() => setShowRelationships(!showRelationships)}
            style={{
              ...styles.button,
              background: showRelationships ? theme.primary : 'transparent',
              color: showRelationships ? 'white' : theme.text,
              border: `1px solid ${showRelationships ? theme.primary : theme.border}`
            }}
            onMouseEnter={(e) => {
              if (!showRelationships) e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
            }}
            onMouseLeave={(e) => {
              if (!showRelationships) e.target.style.background = 'transparent';
            }}
          >
            Relations
          </button>

          <span style={styles.zoomDisplay}>{Math.round(zoom * 100)}%</span>

          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.5))}
            style={{
              ...styles.iconButton,
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            title="Zoom In"
          >
            +
          </button>

          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.3))}
            style={{
              ...styles.iconButton,
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            title="Zoom Out"
          >
            −
          </button>

          <button
            onClick={fitToScreen}
            style={{
              ...styles.button,
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              color: theme.text
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            title="Fit to Screen"
          >
            Fit
          </button>

          <button
            onClick={resetView}
            style={{
              ...styles.button,
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              color: theme.text
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            title="Reset View"
          >
            Reset
          </button>

          <button
            onClick={exportAsPNG}
            style={{
              ...styles.button,
              background: theme.success,
              color: 'white'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            title="Export as PNG"
          >
            Export
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span style={{ color: theme.warning, fontWeight: 'bold' }}>●</span>
          <span>Primary Key</span>
        </div>
        <div style={styles.statusItem}>
          <span style={{ color: theme.error, fontWeight: 'bold' }}>*</span>
          <span>NOT NULL</span>
        </div>
        <div style={styles.statusItem}>
          <span>{schema?.tables?.length || 0} Tables</span>
        </div>
        <div style={styles.statusItem}>
          <span>{schema?.relationships?.length || 0} Relations</span>
        </div>
        {highlightedTables.size > 0 && (
          <div style={styles.statusItem}>
            <span style={{ color: theme.success, fontWeight: 'bold' }}>
              {highlightedTables.size} Match{highlightedTables.size !== 1 ? 'es' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{
            ...styles.canvas,
            cursor: isDragging ? 'grabbing' : (hoveredTable ? 'pointer' : 'grab')
          }}
        />

        {/* Floating Controls Info */}
        <div style={styles.floatingInfo}>
          <span>🖱️ Scroll: Zoom</span>
          <span>👆 Drag: Pan</span>
          <span>👆 Click: Select</span>
        </div>

        {/* Selected Table Info */}
        {selectedTable && tablePositions[selectedTable] && (
          <div style={styles.selectedInfo}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              {selectedTable}
            </div>
            <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
              {tablePositions[selectedTable]?.table?.columns?.length || 0} columns
            </div>
            <button
              onClick={() => setSelectedTable(null)}
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                background: 'transparent',
                color: theme.error,
                border: `1px solid ${theme.error}`,
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.error;
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = theme.error;
              }}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DatabaseFlowchart;
