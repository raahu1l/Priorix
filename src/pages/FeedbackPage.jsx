import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

function FeedbackPage() {
    const [feedback, setFeedback] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await fetch(`${API_BASE}/feedback`);
            const data = await res.json();
            setFeedback(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
            }
        } catch (error) {
            showToast('Failed to load feedback', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const selectedFeedback = feedback.find(f => f.id === selectedId);

    const updateStatus = async (status) => {
        if (!selectedFeedback || actionLoading) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/feedback/${selectedId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                await fetchFeedback();
                showToast(`Marked as ${status.replace('_', ' ')}`);
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const lowerPriority = async () => {
        if (!selectedFeedback || actionLoading) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/feedback/${selectedId}/lower-priority`, {
                method: 'PATCH'
            });
            if (res.ok) {
                await fetchFeedback();
                showToast('Priority lowered by 15 points');
            }
        } catch (error) {
            showToast('Failed to lower priority', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getPriorityClass = (score) => {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };

    const getCategoryClass = (category) => {
        const map = {
            'System Failure': 'system-failure',
            'Bug': 'bug',
            'UI': 'ui',
            'Feature': 'feature'
        };
        return map[category] || 'feature';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner"></div>
                <p>Loading feedback...</p>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Feedback Prioritization</h2>
                <p className="page-subtitle">
                    {feedback.length} items · Ordered by urgency · Select an item to view details and take action
                </p>
            </div>

            <div className="feedback-layout">
                {/* Feedback List */}
                <div className="feedback-list-container glass-solid">
                    <div className="feedback-list-header">
                        <span className="feedback-list-title">
                            Priority Queue ({feedback.filter(f => f.status !== 'resolved').length} active)
                        </span>
                    </div>

                    <div className="feedback-list">
                        {feedback.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No feedback yet</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                                    Go to Data Import to load sample data or import your own
                                </p>
                            </div>
                        ) : (
                            feedback.map((item) => (
                                <div
                                    key={item.id}
                                    className={`feedback-item ${selectedId === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(item.id)}
                                >
                                    <div className="feedback-item-header">
                                        <div className="feedback-priority">
                                            <span className={`priority-score ${getPriorityClass(item.priority_score)}`}>
                                                {item.priority_score}
                                            </span>
                                        </div>
                                        <span className={`feedback-status status-${item.status}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="feedback-content-preview">{item.content}</p>

                                    <div className="feedback-meta">
                                        <span className="feedback-category">
                                            <span className={`category-dot ${getCategoryClass(item.category)}`}></span>
                                            {item.category}
                                        </span>
                                        {item.is_sample === 1 && (
                                            <span className="sample-data-badge">Sample</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Feedback Detail */}
                <div className="feedback-detail-container glass-solid">
                    {selectedFeedback ? (
                        <>
                            <div className="feedback-detail-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span className={`feedback-status status-${selectedFeedback.status}`}>
                                            {selectedFeedback.status.replace('_', ' ')}
                                        </span>
                                        {selectedFeedback.is_sample === 1 && (
                                            <span className="sample-data-badge" style={{ marginLeft: '8px' }}>
                                                Sample Data
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {formatDate(selectedFeedback.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="feedback-detail-content">
                                <div className="detail-section">
                                    <div className="detail-label">Priority Score</div>
                                    <div className="priority-display">
                                        <span className={`priority-score ${getPriorityClass(selectedFeedback.priority_score)}`} style={{ fontSize: '2rem' }}>
                                            {selectedFeedback.priority_score}
                                        </span>
                                        <div className="priority-bar">
                                            <div
                                                className={`priority-bar-fill ${getPriorityClass(selectedFeedback.priority_score)}`}
                                                style={{ width: `${selectedFeedback.priority_score}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-label">Category</div>
                                    <div className="detail-value">
                                        <span className="feedback-category">
                                            <span className={`category-dot ${getCategoryClass(selectedFeedback.category)}`}></span>
                                            {selectedFeedback.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-label">AI Analysis</div>
                                    <div className="detail-value">{selectedFeedback.priority_reason}</div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-label">Feedback Content</div>
                                    <div className="detail-value">{selectedFeedback.content}</div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-label">Source</div>
                                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                                        {selectedFeedback.source}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => updateStatus('in_progress')}
                                    disabled={actionLoading || selectedFeedback.status === 'in_progress'}
                                >
                                    {actionLoading ? <span className="loading-spinner"></span> : null}
                                    Mark In Progress
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => updateStatus('resolved')}
                                    disabled={actionLoading || selectedFeedback.status === 'resolved'}
                                    style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                >
                                    Mark Resolved
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={lowerPriority}
                                    disabled={actionLoading || selectedFeedback.priority_score === 0}
                                >
                                    Lower Priority
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">👈</div>
                            <p>Select a feedback item to view details</p>
                        </div>
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

export default FeedbackPage;
