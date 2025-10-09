import { useState, useMemo } from 'react';

function ResultsTable({ data, columns, darkMode, theme }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const csv = [
      columns.join(','),
      ...data.map(row => columns.map(col => {
        const val = row[col];
        return val !== null && val !== undefined ? `"${val}"` : '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        background: darkMode ? '#1e293b' : '#f8fafc',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ color: theme.text, fontSize: '0.9rem', fontWeight: '600' }}>
            {data.length} row{data.length !== 1 ? 's' : ''}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem',
              background: theme.cardBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportToCSV}
            style={{
              padding: '0.5rem 1rem',
              background: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            📥 Export CSV
          </button>
          <button
            onClick={exportToJSON}
            style={{
              padding: '0.5rem 1rem',
              background: theme.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            📄 Export JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <tr style={{
              background: darkMode
                ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: theme.text,
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: `2px solid ${theme.border}`,
                    transition: 'background 0.2s ease',
                    fontFamily: 'monospace'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#334155' : '#cbd5e1'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {col}
                    {sortColumn === col && (
                      <span style={{ fontSize: '0.8rem' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  background: rowIdx % 2 === 0
                    ? (darkMode ? '#0f172a' : '#ffffff')
                    : (darkMode ? '#1e293b' : '#f8fafc'),
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#334155' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0
                  ? (darkMode ? '#0f172a' : '#ffffff')
                  : (darkMode ? '#1e293b' : '#f8fafc')}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}
                  >
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col])
                      : <span style={{ color: theme.textSecondary, fontStyle: 'italic' }}>NULL</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          padding: '1rem',
          background: darkMode ? '#1e293b' : '#f8fafc',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? theme.border : theme.primary,
              color: currentPage === 1 ? theme.textSecondary : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) e.currentTarget.style.opacity = '1';
            }}
          >
            ← Previous
          </button>

          <span style={{
            color: theme.text,
            fontSize: '0.9rem',
            fontWeight: '600',
            padding: '0 1rem'
          }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? theme.border : theme.primary,
              color: currentPage === totalPages ? theme.textSecondary : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.opacity = '1';
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
