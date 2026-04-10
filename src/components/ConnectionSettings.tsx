import type { FormEvent } from 'react';
import { useState } from 'react';
import { KeyRound, Settings, X } from 'lucide-react';
import { useSystemAuth } from '../auth/SystemAuthContext';

export default function ConnectionSettings() {
  const { apiBaseUrl, clientApiKey, clearKey, isVerified, isVerifying, verifiedInfo, verifyKey } = useSystemAuth();
  const [open, setOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(apiBaseUrl);
  const [apiKey, setApiKey] = useState(clientApiKey);
  const [error, setError] = useState('');

  const openModal = () => {
    setBaseUrl(apiBaseUrl);
    setApiKey(clientApiKey);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      await verifyKey(baseUrl, apiKey);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    }
  };

  const handleClear = () => {
    clearKey();
    setApiKey('');
    setError('');
  };

  return (
    <>
      <div className="admin-system-auth-inline">
        <span className="admin-system-auth-path">{apiBaseUrl}</span>
        <button type="button" className="admin-btn admin-btn-muted" onClick={openModal}>
          <Settings className="h-4 w-4" />
          System Auth
        </button>
      </div>

      {open ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">System Auth</h3>
              <button type="button" className="admin-modal-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <label className="admin-field">
                <span>API Base URL</span>
                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="admin-input" placeholder="/api/v1" required />
              </label>

              <label className="admin-field">
                <span>Gateway API Key</span>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="admin-input" placeholder="Paste your Gateway API key" required />
              </label>

              <div className={`admin-system-auth-alert ${isVerified ? 'is-success' : 'is-error'}`}>
                <div className="admin-system-auth-alert-title">
                  <KeyRound className="h-4 w-4" />
                  {isVerified ? 'Verified' : 'Not verified'}
                </div>
                <div className="admin-system-auth-alert-text">
                  {isVerified ? (
                    <>
                      <div>{verifiedInfo?.apiKeyMasked}</div>
                      <div className="admin-system-auth-alert-subtext">
                        {verifiedInfo?.profileCount ?? 0} profiles available for this browser session.
                      </div>
                    </>
                  ) : (
                    'Generate a key or paste one here, then click Verify. Until then, customer-facing flows stay locked.'
                  )}
                </div>
              </div>

              {error ? <div className="admin-system-auth-error">{error}</div> : null}

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-muted" onClick={handleClear}>
                  Clear
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
