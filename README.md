# NL2SQL Project

Convert natural language queries to SQL and execute them against a PostgreSQL database using AI.

## 🚀 Quick Start

### 1. Setup (First Time)
```powershell
# Install Python dependencies
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Install Node.js dependencies
npm install
cd frontend && npm install && cd ..

# Setup database
psql -U postgres -c "CREATE DATABASE shop_db;"
psql -U postgres -d shop_db -f init_db.sql
```

### 2. Start Services
```powershell
# Automated (recommended)
.\start_services.ps1

# Or manually (3 separate terminals)
.\run_python_service.bat   # Terminal 1
.\run_node_backend.bat     # Terminal 2
.\run_frontend.bat         # Terminal 3
```

### 3. Test & Access
```powershell
# Run tests
.\test_services.ps1

# Open browser
start http://localhost:5173
```

## 📋 Features

✅ **Natural Language to SQL Conversion**
- Powered by FastAPI and T5 transformer model
- Smart mock mode for fast testing (no model loading needed)
- Supports 10+ query patterns

✅ **Full Stack Application**
- React frontend with Vite
- Node.js/Express backend
- FastAPI Python AI service
- PostgreSQL database

✅ **Production-Ready**
- Comprehensive error handling
- CORS configuration
- Input validation
- Health check endpoints
- Async model loading (no freezing)

✅ **Developer Tools**
- Automated startup scripts
- Testing suite
- Detailed documentation
- Batch files for easy launching

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ :5173
│   (Vite + UI)   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Node.js API    │ :5000
│   (Express)     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Python AI API  │ :5001
│   (FastAPI)     │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│   PostgreSQL    │ :5432
│   (Database)    │
└─────────────────┘
```

## 📁 Project Structure

```
NL2SQL_Project/
├── app/
│   ├── server.js              # Express server
│   ├── db.js                  # Database connection
│   ├── controllers/           # Request handlers
│   └── routes/                # API routes
├── python_flask/
│   └── text_to_sql_service.py # AI service (FastAPI)
├── frontend/
│   └── src/
│       ├── App.jsx            # Main UI component
│       └── main.jsx           # Entry point
├── init_db.sql                # Database schema
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
├── start_services.ps1         # Automated startup
├── test_services.ps1          # Testing script
├── run_*.bat                  # Individual service launchers
├── QUICK_START.md             # Fast setup guide
├── SETUP_GUIDE.md             # Complete documentation
└── FIXES_APPLIED.md           # All fixes and improvements
```

## 💡 Example Queries

Try these in the frontend:

**Basic Queries**
```
Show all customers
Show all products
Show all orders
```

**Filtered Queries**
```
Show all customers from New York
Show all products in Electronics category
Show products with price greater than 500
```

**Aggregations**
```
How many customers are there?
Show total revenue from sales
Show recent orders
```

**Join Queries**
```
Show customer orders with product details
```

## 🔧 Configuration

### Mock Mode (Default - Recommended)
Fast, no model loading, realistic SQL generation
```python
# python_flask/text_to_sql_service.py
USE_MOCK = True
```

### Real Model Mode (Requires 16GB+ RAM)
Uses T5 transformer, takes 10-20 minutes to load
```python
USE_MOCK = False
```

### Database Configuration
```javascript
// app/db.js
{
  user: 'postgres',
  password: '2032',
  database: 'shop_db',
  port: 5432
}
```

## 🧪 API Endpoints

### Python FastAPI (Port 5001)
- `GET /` - Service status
- `GET /health` - Health check
- `POST /generate-sql` - Generate SQL from natural language
- `POST /load-model` - Manually load T5 model

### Node.js Backend (Port 5000)
- `POST /api/sql/query` - Process query and return results
- `GET /api/sql/health` - Check AI service availability

## 📊 Database Schema

### Tables
- **customers** (customer_id, name, email, city, created_at)
- **products** (product_id, name, category, price, stock)
- **orders** (order_id, customer_id, product_id, quantity, order_date)

### Sample Data
- 4 customers (New York, Chicago, San Francisco, Boston)
- 4 products (Laptop, Smartphone, Headphones, Office Chair)
- 6 orders (various dates in Sept-Oct 2025)

## 🛠️ Troubleshooting

### Service Not Starting?
```powershell
# Check which ports are in use
Test-NetConnection -ComputerName localhost -Port 5432  # PostgreSQL
Test-NetConnection -ComputerName localhost -Port 5001  # Python
Test-NetConnection -ComputerName localhost -Port 5000  # Node.js
Test-NetConnection -ComputerName localhost -Port 5173  # Frontend
```

### Common Issues

**404 Not Found**
- Solution: Ensure Python service is running on port 5001

**ECONNREFUSED**
- Solution: Start the required service (check error message)

**Database Error**
- Solution: Verify PostgreSQL is running and database exists

**Laptop Freezing**
- Solution: Keep `USE_MOCK = True` (default setting)

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and troubleshooting
- **[FIXES_APPLIED.md](FIXES_APPLIED.md)** - All improvements and fixes

## 🧪 Testing

Run the test suite to verify everything works:
```powershell
.\test_services.ps1
```

This will test:
1. Python FastAPI root endpoint
2. Python FastAPI health check
3. SQL generation
4. Node.js health check
5. Full integration (NL → SQL → DB → Results)
6. Complex query handling

## 🎯 Features Implemented

✅ Root endpoint for service verification
✅ Health check endpoints
✅ Enhanced mock SQL generator (10+ patterns)
✅ Async model loading (non-blocking)
✅ CORS configuration
✅ Comprehensive error handling
✅ Input validation
✅ Detailed logging
✅ Timeout configuration
✅ Automated startup scripts
✅ Testing suite
✅ Complete documentation

## 🚀 Next Steps (Optional)

- [ ] Move credentials to environment variables
- [ ] Add user authentication
- [ ] Implement query history
- [ ] Add SQL syntax validation
- [ ] Deploy to production
- [ ] Load real T5 model (when needed)
- [ ] Add rate limiting
- [ ] Enhance UI/UX

## 📝 Technologies Used

- **Frontend:** React, Vite, Axios
- **Backend:** Node.js, Express, PostgreSQL
- **AI Service:** Python, FastAPI, Transformers (T5)
- **Database:** PostgreSQL
- **Tools:** PowerShell scripts, Batch files

## 📄 License

MIT License - Feel free to use for learning and development

## 🤝 Contributing

Issues and pull requests welcome!

---

**Made with ❤️ for learning Natural Language to SQL conversion**
