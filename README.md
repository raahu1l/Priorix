<div align="center">

# 🧠 Priorix — Product Feedback Prioritization System

**Prioritize product feedback. Fix what matters first.**

[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)]()
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)]()

> A focused product feedback prioritization system that helps teams **analyze, score, and act on software issues** based on urgency and impact — enabling clear, data-driven decisions.

</div>

---

## 🌐 Live Demo

https://priorix-ruddy.vercel.app

---

## 📱 Features

### 📥 Feedback Ingestion
- Import product feedback via CSV, API, or sample dataset
- Supports bugs, failures, UX issues, and feature requests
- Reset and test datasets easily

### 🤖 AI Prioritization Engine
- Categorizes feedback (System Failure, Bug, UI, Feature)
- Assigns priority score (0–100)
- Provides clear reasoning for every score
- Deterministic and explainable outputs

### ⚙️ Workflow Actions
- Mark items as In Progress or Resolved
- Lower priority dynamically
- Real-time priority queue reordering
- Audit trail logging

### 📊 Analytics (Decision-Focused)
- Resolution velocity tracking
- Category spike detection
- Priority distribution trends

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React (Vite) |
| Backend | Node.js · Express |
| Database | SQLite |
| Deployment | Vercel · Render |

---

## 🏗️ Architecture

```
client/        # React frontend
server/        # Express backend
database/      # SQLite storage
api/           # API routes
```

---

## 🚀 Getting Started

### Setup

```bash
git clone https://github.com/your-username/priorix.git
cd priorix
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
node index.js
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  

---

## 🔌 API Example

```bash
curl -X POST https://priorix-awgf.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"content":"Login outage in production","source":"api"}'
```

---

## 🗺️ Roadmap

- [ ] Smarter scoring model
- [ ] Team collaboration features
- [ ] Export reports
- [ ] Role-based dashboards

---

## 👨‍💻 Author

**Rahul Walawalkar**  
📧 walawalkarrahul729@gmail.com  
🔗 https://github.com/raahu1l  

Built with assistance of AI

---

<div align="center">

Built with ❤️ · Star ⭐ if you find it useful

</div>
