/**
 * AI Prioritization Engine
 * Deterministic categorization and scoring based on feedback content analysis
 */
console.log("🔥 PRIORITIZATION ENGINE LOADED");

const CATEGORIES = {
    SYSTEM_FAILURE: 'System Failure',
    BUG: 'Bug',
    UI: 'UI',
    FEATURE: 'Feature'
};

// Keywords for category detection
const CATEGORY_KEYWORDS = {
    [CATEGORIES.SYSTEM_FAILURE]: [
        'crash', 'crashes', 'down', 'outage', 'unavailable',
        'timeout', 'timed out', 'latency', 'slow', 'hang',
        'cannot access', 'cannot login', 'login failed',
        'server error', '500', '503',
        'fatal', 'critical', 'emergency',
        'system failure', 'not working at all',
        'completely broken', 'data loss', 'corruption',
        'memory leak', 'unresponsive'
    ],
    [CATEGORIES.BUG]: [
        'bug', 'error', 'broken', 'not working',
        'issue', 'problem', 'fail', 'failed',
        'incorrect', 'unexpected', 'glitch',
        'malfunction', 'defect', 'regression',
        'doesn\'t work', 'stopped working',
        'freezes'
    ],
    [CATEGORIES.UI]: [
        'ui', 'interface', 'design', 'layout',
        'button', 'display', 'visual',
        'screen', 'alignment', 'responsive',
        'mobile', 'looks', 'appearance',
        'confusing', 'unclear', 'ux',
        'navigation', 'typo'
    ],
    [CATEGORIES.FEATURE]: [
        'feature', 'request', 'add', 'want',
        'would be nice', 'suggestion',
        'could you', 'implement',
        'enhance', 'improve',
        'new', 'additional',
        'please add', 'wish',
        'would love', 'missing',
        'integrate', 'support for'
    ]
};

// Urgency indicators
const URGENCY_INDICATORS = [
    { pattern: /urgent|asap|immediately|critical|emergency/i, boost: 25 },
    { pattern: /blocking|blocker|cannot proceed|stuck/i, boost: 20 },
    { pattern: /production|live|customers affected/i, boost: 20 },
    { pattern: /multiple users|everyone|all users/i, boost: 15 },
    { pattern: /data loss|security|breach/i, boost: 30 }
];

// Impact indicators
const IMPACT_INDICATORS = [
    { pattern: /workaround|temporary fix/i, boost: -10 },
    { pattern: /minor|small|slight/i, boost: -15 },
    { pattern: /major|significant|severe/i, boost: 10 }
];

function normalizeContent(content) {
    if (content === null || content === undefined) return '';
    return String(content).toLowerCase();
}

function detectCategory(content) {
    const text = normalizeContent(content);

    let scores = {
        [CATEGORIES.SYSTEM_FAILURE]: 0,
        [CATEGORIES.BUG]: 0,
        [CATEGORIES.UI]: 0,
        [CATEGORIES.FEATURE]: 0
    };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                scores[category] += keyword.split(' ').length;
            }
        }
    }

    // HARD OVERRIDE: System failures always win if detected
    if (scores[CATEGORIES.SYSTEM_FAILURE] > 0) {
        return CATEGORIES.SYSTEM_FAILURE;
    }

    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function calculateBaseScore(category, weights) {
    return {
        [CATEGORIES.SYSTEM_FAILURE]: Number(weights.weight_system_failure) || 90,
        [CATEGORIES.BUG]: Number(weights.weight_bug) || 70,
        [CATEGORIES.UI]: Number(weights.weight_ui) || 40,
        [CATEGORIES.FEATURE]: Number(weights.weight_feature) || 25
    }[category];
}

function calculatePriorityScore(content, category, weights) {
    let score = calculateBaseScore(category, weights);
    const text = normalizeContent(content);

    for (const indicator of URGENCY_INDICATORS) {
        if (indicator.pattern.test(text)) {
            score += indicator.boost;
        }
    }

    for (const indicator of IMPACT_INDICATORS) {
        if (indicator.pattern.test(text)) {
            score += indicator.boost;
        }
    }

    // System failures should NEVER be low
    if (category === CATEGORIES.SYSTEM_FAILURE) {
        score = Math.max(score, 80);
    }

    return Math.max(0, Math.min(100, score));
}

function generateReason(content, category, score) {
    const reasons = [];

    if (category === CATEGORIES.SYSTEM_FAILURE) {
        reasons.push('Critical system issue detected.');
    } else if (category === CATEGORIES.BUG) {
        reasons.push('Functional bug affecting users.');
    } else if (category === CATEGORIES.UI) {
        reasons.push('User interface issue.');
    } else {
        reasons.push('Feature enhancement request.');
    }

    if (score >= 80) {
        reasons.push('High priority — address immediately.');
    } else if (score >= 60) {
        reasons.push('Important — schedule soon.');
    } else {
        reasons.push('Lower priority — review when possible.');
    }

    return reasons.join(' ');
}

function prioritizeFeedback(content, weights = {}) {
    const category = detectCategory(content);
    const score = calculatePriorityScore(content, category, weights);
    const reason = generateReason(content, category, score);

    return {
        category,
        priority_score: score,
        priority_reason: reason
    };
}

module.exports = { prioritizeFeedback, CATEGORIES };
