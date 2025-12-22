import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

function ImportPage() {
    const [sampleLoaded, setSampleLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [apiKeys, setApiKeys] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        checkSampleData();
        fetchApiKeys();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const checkSampleData = async () => {
        try {
            const res = await fetch(`${API_BASE}/feedback`);
            const data = await res.json();
            setSampleLoaded(data.some(f => f.is_sample === 1));
        } catch { }
    };

    const fetchApiKeys = async () => {
        try {
            const res = await fetch(`${API_BASE}/api-keys`);
            const data = await res.json();
            setApiKeys(data.filter(k => k.is_active));
        } catch { }
    };

    const loadSampleData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/sample-data/load`, { method: 'POST' });
            const data = await res.json();
            showToast(`Loaded ${data.imported} sample items`);
            setSampleLoaded(true);
        } catch {
            showToast('Failed to load sample data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetSampleData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/sample-data/reset`, { method: 'POST' });
            const data = await res.json();
            showToast(`Reloaded ${data.imported} sample items`);
        } catch {
            showToast('Failed to reset sample data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearSampleData = async () => {
        setLoading(true);
        try {
            await fetch(`${API_BASE}/sample-data`, { method: 'DELETE' });
            showToast('Sample data cleared');
            setSampleLoaded(false);
        } catch {
            showToast('Failed to clear sample data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearAllFeedback = async () => {
        if (!window.confirm('Delete ALL feedback data?')) return;

        setLoading(true);
        try {
            await fetch(`${API_BASE}/feedback`, { method: 'DELETE' });
            showToast('All feedback cleared');
            setSampleLoaded(false);
        } catch {
            showToast('Failed to clear feedback', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FINAL CSV IMPORT (NO FILTERING, NO FAILURES)
    const handleFileSelect = async (file) => {
        if (!file || !file.name.endsWith('.csv')) {
            showToast('Please select a CSV file', 'error');
            return;
        }

        setLoading(true);
        try {
            const text = await file.text();

            const lines = text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.toLowerCase().startsWith('content'));

            const payload = lines.map(line => ({
                content: line.replace(/^"|"$/g, '')
            }));

            if (payload.length === 0) {
                showToast('CSV has no valid rows', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/feedback/import-csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Import failed');
            }

            const result = await res.json();
            showToast(`Imported ${result.imported} feedback items`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const activeApiKey = apiKeys[0]?.key || 'fp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Data Import</h2>
                <p className="page-subtitle">
                    Import external feedback for AI prioritization
                </p>
            </div>

            <div className="import-grid">

                <div className="import-card glass-solid">
                    <h3>Sample Feedback</h3>
                    {!sampleLoaded ? (
                        <button className="btn btn-primary" onClick={loadSampleData} disabled={loading}>
                            Load Sample Data
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={resetSampleData} disabled={loading}>
                                Reset Sample Data
                            </button>
                            <button className="btn btn-ghost" onClick={clearSampleData} disabled={loading}>
                                Clear Sample Data
                            </button>
                        </>
                    )}
                </div>

                <div className="import-card glass-solid">
                    <h3>CSV Import</h3>
                    <div
                        className={`file-upload-zone ${dragOver ? 'dragover' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={e => handleFileSelect(e.target.files[0])}
                        />
                        Drop CSV here or click to upload
                    </div>
                </div>

                <div className="import-card glass-solid" style={{ gridColumn: 'span 2' }}>
                    <h3>REST API</h3>
                    <div className="code-block">
                        curl -X POST http://localhost:3001/api/feedback{'\n'}
                        -H "Content-Type: application/json"{'\n'}
                        -H "X-API-Key: {activeApiKey}"{'\n'}
                        -d {"{\"content\":\"Login outage in production\"}"}
                    </div>
                </div>
            </div>

            <button
                className="btn btn-danger"
                onClick={clearAllFeedback}
                disabled={loading}
                style={{ marginTop: '16px' }}
            >
                Clear All Feedback
            </button>

            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        </>
    );
}

export default ImportPage;
