import { useState } from 'react';

function DatabaseConfig({ onConnect, darkMode, theme }) {
  const [config, setConfig] = useState({
    user: 'postgres',
    host: 'localhost',
    database: 'employee',
    password: '2032',
    port: 5432,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/sql/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onConnect(config);
        }, 1000);
      } else {
        setError(data.error || 'Failed to connect to database');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = theme;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: currentTheme.background,
      padding: '2rem'
    }}>
      <div style={{
        background: currentTheme.cardBg,
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `1px solid ${currentTheme.border}`,
        maxWidth: '500px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: `1px solid ${currentTheme.border}`,
          background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}15 100%)`
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: currentTheme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '2rem' }}>🗄️</span>
            Database Configuration
          </h2>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: currentTheme.textSecondary,
            fontSize: '0.95rem'
          }}>
            Configure your PostgreSQL database connection
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Host */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: currentTheme.text,
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Host
              </label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="localhost"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  background: currentTheme.background,
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              />
            </div>

            {/* Port */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: currentTheme.text,
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Port
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
                placeholder="5432"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  background: currentTheme.background,
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              />
            </div>

            {/* Database */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: currentTheme.text,
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Database Name
              </label>
              <input
                type="text"
                value={config.database}
                onChange={(e) => handleInputChange('database', e.target.value)}
                placeholder="employee"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  background: currentTheme.background,
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              />
            </div>

            {/* User */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: currentTheme.text,
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Username
              </label>
              <input
                type="text"
                value={config.user}
                onChange={(e) => handleInputChange('user', e.target.value)}
                placeholder="postgres"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  background: currentTheme.background,
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: currentTheme.text,
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Password
              </label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: `2px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  background: currentTheme.background,
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                onBlur={(e) => e.target.style.borderColor = currentTheme.border}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: darkMode ? '#450a0a' : '#fef2f2',
              border: `2px solid ${currentTheme.error}`,
              borderRadius: '8px',
              color: currentTheme.error,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: darkMode ? '#064e3b' : '#f0fdf4',
              border: `2px solid ${currentTheme.success}`,
              borderRadius: '8px',
              color: currentTheme.success,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              Connected successfully! Redirecting...
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={loading || !config.user || !config.database || !config.password}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '1rem',
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'white',
              background: loading || !config.user || !config.database || !config.password
                ? '#6b7280'
                : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !config.user || !config.database || !config.password ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading || !config.user || !config.database || !config.password
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading && config.user && config.database && config.password) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = loading || !config.user || !config.database || !config.password
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                🔌 Connect to Database
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: `1px solid ${currentTheme.border}`,
          background: currentTheme.background
        }}>
          <p style={{
            margin: 0,
            color: currentTheme.textSecondary,
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            Make sure PostgreSQL is running and accessible
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default DatabaseConfig;
