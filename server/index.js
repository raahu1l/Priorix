const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { prioritizeFeedback } = require('./prioritization');
const sampleData = require('./sampleData');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 🔧 Helper: Build analysis text safely
function buildAnalysisText(item) {
  return `${item.title || ''} ${item.description || ''} ${item.content || ''}`.trim();
}

// Helper: Get priority weights from settings
function getWeights() {
  const rows = db.prepare('SELECT key, value FROM settings WHERE key LIKE ?').all('weight_%');
  const weights = {};
  rows.forEach(row => {
    weights[row.key] = row.value;
  });
  return weights;
}

// Helper: Log audit action
function logAction(feedbackId, action, oldValue, newValue) {
  db.prepare(`
    INSERT INTO audit_log (id, feedback_id, action, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), feedbackId, action, oldValue, newValue);
}

// ==================== FEEDBACK ENDPOINTS ====================

// Get all feedback (ordered by priority)
app.get('/api/feedback', (req, res) => {
  const feedback = db.prepare(`
    SELECT * FROM feedback 
    ORDER BY 
      CASE status 
        WHEN 'pending' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'resolved' THEN 3 
      END,
      priority_score DESC,
      created_at DESC
  `).all();
  res.json(feedback);
});

// Get single feedback
app.get('/api/feedback/:id', (req, res) => {
  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!feedback) {
    return res.status(404).json({ error: 'Feedback not found' });
  }
  res.json(feedback);
});

// Create feedback (API ingestion)
app.post('/api/feedback', (req, res) => {
  const { content, source = 'api' } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (source === 'api') {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    const keyExists = db
      .prepare('SELECT id FROM api_keys WHERE key = ? AND is_active = 1')
      .get(apiKey);

    if (!keyExists) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }

  const weights = getWeights();
  const priority = prioritizeFeedback(content, weights);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO feedback (id, content, source, category, priority_score, priority_reason, is_sample)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, content.trim(), source, priority.category, priority.priority_score, priority.priority_reason, source === 'sample' ? 1 : 0);

  logAction(id, 'created', null, 'pending');

  const created = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update feedback status
app.patch('/api/feedback/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in_progress', 'resolved'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const current = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  db.prepare(`
    UPDATE feedback SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.id);

  logAction(req.params.id, 'status_change', current.status, status);

  const updated = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Lower priority
app.patch('/api/feedback/:id/lower-priority', (req, res) => {
  const current = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Feedback not found' });

  const newScore = Math.max(0, current.priority_score - 15);

  db.prepare(`
    UPDATE feedback SET priority_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newScore, req.params.id);

  logAction(req.params.id, 'priority_lowered', String(current.priority_score), String(newScore));

  const updated = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ==================== CSV IMPORT ====================

app.post('/api/feedback/import-csv', (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'Data array is required' });
  }

  const weights = getWeights();
  let imported = 0;

  for (const item of data) {
    const analysisText = buildAnalysisText(item);
    if (!analysisText) continue;

    const priority = prioritizeFeedback(analysisText, weights);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO feedback (id, content, source, category, priority_score, priority_reason, is_sample)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, analysisText, 'csv', priority.category, priority.priority_score, priority.priority_reason, 0);

    logAction(id, 'created', null, 'pending');
    imported++;
  }

  res.json({ imported });
});
// ==================== SAMPLE DATA ====================

// Load sample data
app.post('/api/sample-data/load', (req, res) => {
  const weights = getWeights();
  let imported = 0;

  for (const item of sampleData) {
    const analysisText = buildAnalysisText(item);
    if (!analysisText) continue;

    const priority = prioritizeFeedback(analysisText, weights);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO feedback (
        id, content, source, category,
        priority_score, priority_reason, is_sample
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      analysisText,
      'sample',
      priority.category,
      priority.priority_score,
      priority.priority_reason,
      1
    );

    logAction(id, 'created', null, 'pending');
    imported++;
  }

  res.json({ imported });
});

// Reset sample data (clear + reload)
app.post('/api/sample-data/reset', (req, res) => {
  const sampleIds = db.prepare(
    'SELECT id FROM feedback WHERE is_sample = 1'
  ).all();

  for (const row of sampleIds) {
    db.prepare('DELETE FROM audit_log WHERE feedback_id = ?').run(row.id);
  }

  db.prepare('DELETE FROM feedback WHERE is_sample = 1').run();

  const weights = getWeights();
  let imported = 0;

  for (const item of sampleData) {
    const analysisText = buildAnalysisText(item);
    if (!analysisText) continue;

    const priority = prioritizeFeedback(analysisText, weights);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO feedback (
        id, content, source, category,
        priority_score, priority_reason, is_sample
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      analysisText,
      'sample',
      priority.category,
      priority.priority_score,
      priority.priority_reason,
      1
    );

    logAction(id, 'created', null, 'pending');
    imported++;
  }

  res.json({ reset: true, imported });
});

// Clear sample data only
app.delete('/api/sample-data', (req, res) => {
  const sampleIds = db.prepare(
    'SELECT id FROM feedback WHERE is_sample = 1'
  ).all();

  for (const row of sampleIds) {
    db.prepare('DELETE FROM audit_log WHERE feedback_id = ?').run(row.id);
  }

  db.prepare('DELETE FROM feedback WHERE is_sample = 1').run();

  res.json({ cleared: true });
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get analytics data
app.get('/api/analytics', (req, res) => {
  // Category distribution
  const categoryDistribution = db.prepare(`
    SELECT category, COUNT(*) as count FROM feedback GROUP BY category
  `).all();

  // Status distribution
  const statusDistribution = db.prepare(`
    SELECT status, COUNT(*) as count FROM feedback GROUP BY status
  `).all();

  // Priority distribution
  const priorityDistribution = db.prepare(`
    SELECT 
      CASE 
        WHEN priority_score >= 80 THEN 'Critical (80-100)'
        WHEN priority_score >= 60 THEN 'High (60-79)'
        WHEN priority_score >= 40 THEN 'Medium (40-59)'
        ELSE 'Low (0-39)'
      END as priority_range,
      COUNT(*) as count
    FROM feedback
    GROUP BY priority_range
    ORDER BY 
      CASE priority_range
        WHEN 'Critical (80-100)' THEN 1
        WHEN 'High (60-79)' THEN 2
        WHEN 'Medium (40-59)' THEN 3
        ELSE 4
      END
  `).all();

  // Resolution velocity (last 7 days)
  const resolutionVelocity = db.prepare(`
    SELECT 
      DATE(updated_at) as date,
      COUNT(*) as resolved
    FROM feedback
    WHERE status = 'resolved'
    AND updated_at >= DATE('now', '-7 days')
    GROUP BY DATE(updated_at)
    ORDER BY date
  `).all();

  // Category trends over time
  const categoryTrends = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      category,
      COUNT(*) as count
    FROM feedback
    WHERE created_at >= DATE('now', '-7 days')
    GROUP BY DATE(created_at), category
    ORDER BY date
  `).all();

  // Total counts
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
    FROM feedback
  `).get();

  res.json({
    categoryDistribution,
    statusDistribution,
    priorityDistribution,
    resolutionVelocity,
    categoryTrends,
    totals
  });
});

// ==================== SETTINGS ENDPOINTS ====================

// Get settings
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  res.json(settingsObj);
});

// Update settings
app.patch('/api/settings', (req, res) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(value), key);
  }

  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  res.json(settingsObj);
});

// ==================== API KEY ENDPOINTS ====================

// Get API keys
app.get('/api/api-keys', (req, res) => {
  const keys = db.prepare('SELECT id, name, key, created_at, is_active FROM api_keys').all();
  res.json(keys);
});

// Create API key
app.post('/api/api-keys', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = uuidv4();
  const key = 'fp_' + uuidv4().replace(/-/g, '');

  db.prepare('INSERT INTO api_keys (id, name, key) VALUES (?, ?, ?)').run(id, name.trim(), key);

  const created = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Toggle API key
app.patch('/api/api-keys/:id/toggle', (req, res) => {
  const current = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'API key not found' });
  }

  const newStatus = current.is_active ? 0 : 1;
  db.prepare('UPDATE api_keys SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

  const updated = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete API key
app.delete('/api/api-keys/:id', (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ==================== AUDIT LOG ENDPOINTS ====================

// Get audit log
app.get('/api/audit-log', (req, res) => {
  const logs = db.prepare(`
    SELECT 
      audit_log.*,
      feedback.content as feedback_content
    FROM audit_log
    LEFT JOIN feedback ON audit_log.feedback_id = feedback.id
    ORDER BY audit_log.created_at DESC
    LIMIT 100
  `).all();
  res.json(logs);
});

// ==================== CLEAR ALL FEEDBACK ====================
app.delete('/api/feedback', (req, res) => {
  db.prepare('DELETE FROM audit_log').run();
  db.prepare('DELETE FROM feedback').run();
  res.json({ cleared: true });
});


// ==================== CLEAN INVALID FEEDBACK (ONE-TIME) ====================
app.delete('/api/debug/cleanup-invalid-feedback', (req, res) => {
  const result = db.prepare(`
    DELETE FROM feedback
    WHERE content GLOB '[0-9]*'
       OR TRIM(content) = ''
  `).run();

  res.json({ deleted: result.changes });
});

// Start server
app.listen(PORT, () => {
  console.log(`Feedback Prioritization API running on http://localhost:${PORT}`);
});
