# Priorix

**Decide what to fix first.**

Priorix is a feedback prioritization system designed to help engineering and product teams clearly understand what issues matter most, act on them first, and analyze trends over time.

Live Demo:  
https://priorix-ruddy.vercel.app

---

## What Priorix Is

Priorix helps teams:

- Import feedback from external sources  
- Automatically analyze urgency and impact  
- Assign clear priority scores (0–100)  
- Order feedback so teams know what to fix first  
- Track progress and resolution velocity  
- Analyze trends over time  

---

## What Priorix Is NOT

- ❌ Not a feedback collection form  
- ❌ Not a monitoring or uptime dashboard  
- ❌ Not a ticketing system  
- ❌ Not an AI chat or assistant  

---

## Core Features

### Feedback Ingestion
- Sample feedback dataset (for testing)
- CSV import
- REST API ingestion using API keys
- Clear / reset data controls

### AI Prioritization Engine
For every feedback item:
- Category (System Failure, Bug, UI, Feature)
- Priority score (0–100)
- Short plain-language reason

### Actionable Workflow
- Mark In Progress
- Mark Resolved
- Lower Priority

### Analytics
- Resolution velocity
- Category trend spikes
- Priority distribution over time

---

## Tech Stack

Frontend:
- React (Vite)

Backend:
- Node.js
- Express
- SQLite

Deployment:
- Frontend: Vercel
- Backend: Render

---

## Local Development

```bash
git clone https://github.com/your-username/priorix.git
cd priorix
npm install
cd server
npm install
node index.js
```

Frontend:
```bash
npm run dev
```

---

## API Example

```bash
curl -X POST https://priorix-awgf.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"content":"Login outage in production","source":"api"}'
```

---

## License

MIT

---

Built by Rahul Walawalkar
