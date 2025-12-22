# Priorix

**Decide what to fix first.**

Priorix is a feedback prioritization system that helps teams import feedback from multiple sources, automatically assess urgency and impact, and clearly order what should be addressed first.

Live Demo:  
👉 https://priorix-ruddy.vercel.app

---

## What Priorix Does

Priorix is built for **engineering and product teams** to:

- Import feedback from external sources (CSV, API, sample dataset)
- Automatically categorize feedback (System Failure, Bug, UI, Feature)
- Assign a deterministic priority score (0–100) with a short reason
- Clearly order feedback by urgency
- Track resolution progress
- Analyze trends over time

---

## What Priorix Is NOT

- ❌ Not a feedback collection form  
- ❌ Not a monitoring or uptime dashboard  
- ❌ Not a ticketing or issue tracker  
- ❌ Not an AI chat or assistant  

Its sole purpose is **prioritization and decision clarity**.

---

## Core Features

### 1. Feedback Ingestion
- Sample feedback dataset (for testing)
- CSV import
- REST API ingestion using API keys
- Ability to clear or reset data

### 2. AI Prioritization Engine
For every feedback item:
- Category
- Priority score (0–100)
- Short plain-language reason

The engine is **deterministic** — the same input always produces the same output.

### 3. Actionable Workflow
Each feedback item supports:
- Mark In Progress
- Mark Resolved
- Lower Priority

Actions update state immediately and are logged.

### 4. Analytics (Decision-Focused)
- Resolution velocity
- Category trend spikes
- Priority distribution over time

No vanity metrics. No pie charts.

---

## Tech Stack

### Frontend
- React (Vite)
- Modern CSS with glassmorphic “liquid glass” design
- React Router

### Backend
- Node.js
- Express
- SQLite (for demo / MVP)

### Deployment
- Frontend: Vercel
- Backend: Render

---

## Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/priorix.git
cd priorix
2. Install dependencies
bash
Copy code
npm install
cd server
npm install
3. Start the backend
bash
Copy code
cd server
node index.js
Backend runs on:

arduino
Copy code
http://localhost:3001
4. Start the frontend
bash
Copy code
npm run dev
Frontend runs on:

arduino
Copy code
http://localhost:5173
API Base URLs
Production
text
Copy code
https://priorix-awgf.onrender.com/api
Local Development
text
Copy code
http://localhost:3001/api
API Example (cURL)
bash
Copy code
curl -X POST https://priorix-awgf.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"content":"Login outage in production","source":"api"}'
Replace YOUR_API_KEY_HERE with a key generated in Settings.

Testing the System
Open Data Import

Load the sample dataset or upload a CSV

Go to Feedback Prioritization

Take actions on feedback items

View trends in Analytics

All features work end-to-end without external dependencies.

Known Limitations
SQLite storage is not persistent across backend redeploys

Designed for MVP, demos, and hackathons

Can be upgraded to PostgreSQL for full production use

License
MIT License

Author
Built by Rahul Walawalkar
