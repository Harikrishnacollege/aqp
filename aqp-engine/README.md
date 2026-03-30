# ⚡ AQP Engine — Approximate Query Processing

> Run SQL-like queries **3–10× faster** with tunable accuracy using statistical sampling.

---

## 📁 Project Structure

```
aqp-engine/
├── backend/
│   ├── main.py              ← FastAPI server
│   ├── generate_data.py     ← Run once to create dataset
│   ├── requirements.txt
│   └── engine/
│       ├── sampler.py       ← Sampling logic
│       ├── query_parser.py  ← SQL parser
│       ├── executor.py      ← Query executor with scaling
│       └── error_estimator.py
│
├── frontend/
│   └── src/
│       ├── App.jsx          ← Full React UI
│       └── index.js
│
├── start.sh                 ← Mac/Linux one-click start
└── start.bat                ← Windows one-click start
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm

---

### Option A — One-click (Mac/Linux)

```bash
chmod +x start.sh
./start.sh
```

### Option B — One-click (Windows)

Double-click `start.bat`

---

### Option C — Manual (step by step)

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python generate_data.py           # generates 1M row dataset (run once)
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 🌐 URLs

| Service   | URL                             |
|-----------|----------------------------------|
| App UI    | http://localhost:3000            |
| API       | http://localhost:8000            |
| API Docs  | http://localhost:8000/docs       |

---

## 💡 Supported Queries

| Query | Example |
|-------|---------|
| COUNT | `SELECT COUNT(*) FROM data` |
| SUM   | `SELECT SUM(price) FROM data` |
| AVG   | `SELECT AVG(revenue) FROM data` |
| GROUP BY | `SELECT COUNT(*) FROM data GROUP BY region` |
| SUM + GROUP | `SELECT SUM(price) FROM data GROUP BY product` |

**Available columns:** `price`, `quantity`, `revenue`, `clicked`  
**Group by columns:** `region`, `product`, `category`, `clicked`

---

## 🎯 How It Works

1. **Sampling** — Only scan X% of the data (controlled by slider)
2. **Scaling** — Multiply COUNT/SUM results by `1/fraction` to estimate full value
3. **AVG** — No scaling needed (AVG is sample-consistent)
4. **Error %** — Compared against exact result live

---

## 🏆 Demo Script

> "Our system uses Approximate Query Processing with statistical sampling to deliver results up to **10× faster** while maintaining controllable accuracy. Users can tune the accuracy/speed tradeoff in real time."

Show:
1. Run a GROUP BY query at 10% → instant result
2. Compare with exact
3. Hit the Benchmark tab → show speedup chart

---

## 📬 API Reference

**POST /query**
```
?query=SELECT COUNT(*) FROM data GROUP BY region
&sample_fraction=0.1
```

**GET /benchmark**
```
?query=SELECT COUNT(*) FROM data
```
