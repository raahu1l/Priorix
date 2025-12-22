import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

function SettingsPage() {
    const [settings, setSettings] = useState({
        weight_system_failure: 100,
        weight_bug: 75,
        weight_ui: 50,
        weight_feature: 25
    });
    const [apiKeys, setApiKeys] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [settingsRes, keysRes, logsRes] = await Promise.all([
                fetch(`${API_BASE}/settings`),
                fetch(`${API_BASE}/api-keys`),
                fetch(`${API_BASE}/audit-log`)
            ]);

            const settingsData = await settingsRes.json();
            const keysData = await keysRes.json();
            const logsData = await logsRes.json();

            setSettings({
                weight_system_failure: parseInt(settingsData.weight_system_failure) || 100,
                weight_bug: parseInt(settingsData.weight_bug) || 75,
                weight_ui: parseInt(settingsData.weight_ui) || 50,
                weight_feature: parseInt(settingsData.weight_feature) || 25
            });
            setApiKeys(keysData);
            setAuditLog(logsData);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await fetch(`${API_BASE}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            showToast('Settings saved successfully');
        } catch (error) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const createApiKey = async () => {
        if (!newKeyName.trim()) {
            showToast('Please enter a key name', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api-keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const newKey = await res.json();
            setApiKeys([...apiKeys, newKey]);
            setNewKeyName('');
            showToast('API key created');
        } catch (error) {
            showToast('Failed to create API key', 'error');
        }
    };

    const toggleApiKey = async (id) => {
        try {
            await fetch(`${API_BASE}/api-keys/${id}/toggle`, { method: 'PATCH' });
            const updated = apiKeys.map(k =>
                k.id === id ? { ...k, is_active: k.is_active ? 0 : 1 } : k
            );
            setApiKeys(updated);
            showToast('API key updated');
        } catch (error) {
            showToast('Failed to update API key', 'error');
        }
    };

    const deleteApiKey = async (id) => {
        try {
            await fetch(`${API_BASE}/api-keys/${id}`, { method: 'DELETE' });
            setApiKeys(apiKeys.filter(k => k.id !== id));
            showToast('API key deleted');
        } catch (error) {
            showToast('Failed to delete API key', 'error');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAction = (action) => {
        const actionMap = {
            'created': 'Created',
            'status_change': 'Status Changed',
            'priority_lowered': 'Priority Lowered'
        };
        return actionMap[action] || action;
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner"></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Settings</h2>
                <p className="page-subtitle">Configure API access, priority weights, and view system audit log</p>
            </div>

            {/* API Key Management */}
            <div className="settings-section">
                <h3 className="settings-section-title">API Key Management</h3>
                <div className="settings-card glass-solid">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                        Create API keys to authenticate REST API requests for feedback ingestion.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Key name (e.g., Production, Development)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={createApiKey}>
                            Create Key
                        </button>
                    </div>

                    {apiKeys.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                            No API keys created yet
                        </p>
                    ) : (
                        apiKeys.map(key => (
                            <div key={key.id} className="api-key-item">
                                <div className="api-key-info">
                                    <div className="api-key-name">
                                        {key.name}
                                        {!key.is_active && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '0.75rem',
                                                color: 'var(--priority-critical)',
                                                fontWeight: 'normal'
                                            }}>
                                                (Disabled)
                                            </span>
                                        )}
                                    </div>
                                    <div className="api-key-value">{key.key}</div>
                                </div>
                                <div className="api-key-actions">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            navigator.clipboard.writeText(key.key);
                                            showToast('Key copied to clipboard');
                                        }}
                                    >
                                        Copy
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => toggleApiKey(key.id)}
                                    >
                                        {key.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteApiKey(key.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Priority Weights */}
            <div className="settings-section">
                <h3 className="settings-section-title">Priority Weighting Controls</h3>
                <div className="settings-card glass-solid">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
                        Adjust base priority scores for each feedback category. Higher values mean higher default priority.
                        New feedback will be scored using these weights.
                    </p>

                    <div className="weight-slider">
                        <span className="weight-label" style={{ color: 'var(--category-system-failure)' }}>
                            System Failure
                        </span>
                        <input
                            type="range"
                            className="weight-input"
                            min="0"
                            max="100"
                            value={settings.weight_system_failure}
                            onChange={(e) => setSettings({ ...settings, weight_system_failure: parseInt(e.target.value) })}
                        />
                        <span className="weight-value">{settings.weight_system_failure}</span>
                    </div>

                    <div className="weight-slider">
                        <span className="weight-label" style={{ color: 'var(--category-bug)' }}>
                            Bug
                        </span>
                        <input
                            type="range"
                            className="weight-input"
                            min="0"
                            max="100"
                            value={settings.weight_bug}
                            onChange={(e) => setSettings({ ...settings, weight_bug: parseInt(e.target.value) })}
                        />
                        <span className="weight-value">{settings.weight_bug}</span>
                    </div>

                    <div className="weight-slider">
                        <span className="weight-label" style={{ color: 'var(--category-ui)' }}>
                            UI
                        </span>
                        <input
                            type="range"
                            className="weight-input"
                            min="0"
                            max="100"
                            value={settings.weight_ui}
                            onChange={(e) => setSettings({ ...settings, weight_ui: parseInt(e.target.value) })}
                        />
                        <span className="weight-value">{settings.weight_ui}</span>
                    </div>

                    <div className="weight-slider">
                        <span className="weight-label" style={{ color: 'var(--category-feature)' }}>
                            Feature
                        </span>
                        <input
                            type="range"
                            className="weight-input"
                            min="0"
                            max="100"
                            value={settings.weight_feature}
                            onChange={(e) => setSettings({ ...settings, weight_feature: parseInt(e.target.value) })}
                        />
                        <span className="weight-value">{settings.weight_feature}</span>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={saveSettings}
                            disabled={saving}
                        >
                            {saving ? <span className="loading-spinner"></span> : null}
                            Save Weights
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="settings-section">
                <h3 className="settings-section-title">Audit Log</h3>
                <div className="settings-card glass-solid" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {auditLog.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                            No actions logged yet
                        </p>
                    ) : (
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLog.map(log => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.created_at)}</td>
                                        <td className="audit-action">{formatAction(log.action)}</td>
                                        <td>
                                            {log.old_value && log.new_value ? (
                                                <span>
                                                    {log.old_value} → {log.new_value}
                                                </span>
                                            ) : log.new_value ? (
                                                <span>{log.new_value}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.feedback_content?.substring(0, 50) || '—'}
                                            {log.feedback_content?.length > 50 ? '...' : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </>
    );
}

export default SettingsPage;
