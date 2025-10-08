# NL2SQL Project - Setup & Troubleshooting Guide

## Overview
This project converts natural language queries to SQL and executes them against a PostgreSQL database.

## Architecture
```
User Input → React Frontend (5173)
           ↓
           Node.js Backend (5000)
           ↓
           Python FastAPI AI Service (5001)
           ↓
           PostgreSQL Database (5432)
```

## Prerequisites
1. **PostgreSQL** - Running on port 5432
2. **Node.js** - v14 or higher
3. **Python** - v3.8 or higher
4. **Git Bash or PowerShell** - For running scripts

---

## Setup Instructions

### 1. Database Setup
```sql
-- Create database
CREATE DATABASE shop_db;

-- Run initialization script
psql -U postgres -d shop_db -f init_db.sql
```

**Default credentials (update in `app/db.js` if different):**
- User: `postgres`
- Password: `2032`
- Database: `shop_db`
- Port: `5432`

### 2. Python Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Git Bash:
source venv/Scripts/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Node.js Backend Setup
```bash
# Install dependencies (root directory)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running the Application

### Option 1: Automated Startup (PowerShell - Recommended)
```powershell
# Start all services automatically
.\start_services.ps1

# Test all services
.\test_services.ps1
```

### Option 2: Manual Startup

#### Terminal 1: Python FastAPI Service
```bash
cd python_flask
..\venv\Scripts\python.exe -m uvicorn text_to_sql_service:app --host 127.0.0.1 --port 5001
```

#### Terminal 2: Node.js Backend
```bash
node app/server.js
```

#### Terminal 3: React Frontend
```bash
cd frontend
npm run dev
```

---

## Testing the API

### PowerShell Commands

#### Test Python FastAPI
```powershell
# Test root endpoint
Invoke-RestMethod -Uri "http://127.0.0.1:5001/" -Method Get

# Test health endpoint
Invoke-RestMethod -Uri "http://127.0.0.1:5001/health" -Method Get

# Test SQL generation
Invoke-RestMethod -Uri "http://127.0.0.1:5001/generate-sql" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nl_query": "Show all customers from New York"}'
```

#### Test Node.js Backend
```powershell
# Test health check
Invoke-RestMethod -Uri "http://localhost:5000/api/sql/health" -Method Get

# Test full query
Invoke-RestMethod -Uri "http://localhost:5000/api/sql/query" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nl_query": "Show all customers"}'
```

---

## Common Issues & Solutions

### Issue 1: "404 Not Found" when accessing Python API
**Cause:** Server not running or wrong URL

**Solution:**
1. Ensure Python service is running on port 5001
2. Access `http://127.0.0.1:5001/` (note: 127.0.0.1, not localhost)
3. Check root endpoint exists (now fixed in updated code)

### Issue 2: "Unable to connect to the remote server"
**Cause:** FastAPI service not started or crashed during model loading

**Solution:**
1. Check if port 5001 is in use: `Test-NetConnection -ComputerName localhost -Port 5001`
2. Keep `USE_MOCK = True` in `text_to_sql_service.py` (default)
3. Check Python terminal for error messages
4. Ensure virtual environment is activated

### Issue 3: Laptop freezes when loading model
**Cause:** T5 model (11GB) is too large for available memory

**Solution:**
- Keep `USE_MOCK = True` in `python_flask/text_to_sql_service.py`
- Mock mode provides realistic SQL responses without model loading
- To use real model: Set `USE_MOCK = False` (requires 16GB+ RAM and 10-20 min load time)

### Issue 4: Node.js can't reach Python backend
**Cause:** Wrong endpoint, CORS issues, or service not running

**Solution:**
1. Verify Python service is running: `http://127.0.0.1:5001/`
2. Check endpoint is `/generate-sql` (not `/nl2sql`)
3. Ensure CORS is enabled (now fixed in updated code)
4. Check Node.js console for connection errors

### Issue 5: PowerShell commands fail
**Cause:** PowerShell uses different syntax than curl

**Solution:**
Use `Invoke-RestMethod` instead of `curl`:
```powershell
# ✓ Correct
Invoke-RestMethod -Uri "URL" -Method POST -ContentType "application/json" -Body '{"key":"value"}'

# ✗ Wrong (curl doesn't work natively in PowerShell)
curl -X POST "URL" -H "Content-Type: application/json" -d '{"key":"value"}'
```

### Issue 6: Database connection fails
**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Verify PostgreSQL is running: `Test-NetConnection -ComputerName localhost -Port 5432`
2. Check credentials in `app/db.js` match your PostgreSQL setup
3. Ensure database `shop_db` exists
4. Run `init_db.sql` to create tables and sample data

### Issue 7: Frontend can't connect to backend
**Cause:** Port mismatch or backend not running

**Solution:**
1. Ensure Node.js backend is running on port 5000
2. Check frontend URL in `App.jsx`: `http://localhost:5000/api/sql/query`
3. Verify CORS is enabled in `app/server.js`

---

## API Endpoints Reference

### Python FastAPI (Port 5001)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root endpoint - returns service status |
| `/health` | GET | Health check endpoint |
| `/generate-sql` | POST | Generate SQL from natural language |
| `/load-model` | POST | Manually trigger model loading (when USE_MOCK=False) |

### Node.js Backend (Port 5000)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sql/query` | POST | Process NL query and return DB results |
| `/api/sql/health` | GET | Check if AI service is available |

---

## Example Natural Language Queries

### Basic Queries
- "Show all customers"
- "Show all products"
- "Show all orders"

### Filtered Queries
- "Show all customers from New York"
- "Show all products in Electronics category"
- "Show products with price greater than 500"
- "Show products with price less than 200"

### Count Queries
- "How many customers are there?"
- "How many products are there?"
- "How many orders are there?"

### Join Queries
- "Show all orders for customers"
- "Show customer orders with product details"

### Aggregation Queries
- "Show total revenue from sales"
- "Show recent orders"

---

## Configuration

### Mock Mode (Recommended for Testing)
**File:** `python_flask/text_to_sql_service.py`
```python
USE_MOCK = True  # Fast, no model loading, realistic SQL generation
```

### Real Model Mode (Requires 16GB+ RAM)
```python
USE_MOCK = False  # Uses T5 model, takes 10-20 minutes to load
```

### Database Configuration
**File:** `app/db.js`
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'shop_db',
  password: '2032',  // Update this
  port: 5432,
});
```

---

## Architecture Details

### Python FastAPI Service
- **Purpose:** Convert natural language to SQL
- **Mock Mode:** Pattern-based SQL generation (fast, no ML model needed)
- **Real Mode:** T5 transformer model (slow first load, requires GPU/high memory)
- **Features:**
  - CORS enabled
  - Async model loading (non-blocking)
  - Error handling
  - Health checks

### Node.js Backend
- **Purpose:** API gateway between frontend and services
- **Features:**
  - Validates input
  - Calls Python AI service
  - Executes SQL against PostgreSQL
  - Error handling with detailed messages
  - Health check endpoint

### React Frontend
- **Purpose:** User interface
- **Features:**
  - Input field for natural language queries
  - JSON display of results
  - Error messages

### PostgreSQL Database
- **Schema:** 3 tables (customers, products, orders)
- **Sample Data:** 4 customers, 4 products, 6 orders

---

## Project Structure
```
NL2SQL_Project/
├── app/
│   ├── server.js              # Express server
│   ├── db.js                  # PostgreSQL connection
│   ├── controllers/
│   │   └── sqlController.js   # Query handling logic
│   └── routes/
│       └── sqlRoutes.js       # API routes
├── python_flask/
│   └── text_to_sql_service.py # FastAPI AI service
├── frontend/
│   └── src/
│       ├── App.jsx            # Main React component
│       └── main.jsx           # React entry point
├── init_db.sql                # Database initialization
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
├── start_services.ps1         # Automated startup script
├── test_services.ps1          # Testing script
└── SETUP_GUIDE.md             # This file
```

---

## Success Criteria Checklist

- [ ] PostgreSQL running on port 5432
- [ ] Python FastAPI responds at `http://127.0.0.1:5001/`
- [ ] Health endpoint returns status: `http://127.0.0.1:5001/health`
- [ ] Generate SQL endpoint accepts queries: `POST /generate-sql`
- [ ] Node.js backend running on port 5000
- [ ] Backend health check works: `GET /api/sql/health`
- [ ] Full integration test works: `POST /api/sql/query`
- [ ] React frontend loads at `http://localhost:5173`
- [ ] Can submit queries through UI and see results

---

## Need Help?

1. **Check service status:** Run `.\test_services.ps1`
2. **Check logs:** Look at each terminal window for error messages
3. **Verify ports:** Use `Test-NetConnection -ComputerName localhost -Port [PORT]`
4. **Test individually:** Test each service separately before integration
5. **Check this guide:** Most issues are documented above

---

## Development Notes

- **Mock mode is recommended** for development and testing
- Real model loading can take 10-20 minutes and requires significant memory
- Keep services running in separate terminal windows for easy monitoring
- Use PowerShell scripts for automated testing and deployment
