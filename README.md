# Amdox ERP: AI-Powered Cloud Enterprise Resource Suite

Amdox ERP is a modern, premium, and feature-rich Cloud ERP suite designed to manage business workflows. It provides a distinct **Admin Panel** and **User (Employee) Panel** with role-based access control.

---

## 🚀 Key Modules & Features

### 1. 📊 Business Intelligence
- Real-time interactive dashboard visualizing revenue, cash flow, inventory levels, and system health metrics.

### 2. 🪙 Double-Entry General Ledger
- GAAP-compliant multi-currency accounting log.
- Enforces strict trial balance checks (Debits = Credits) for all journal entries.

### 3. 📄 AP / AR Automation
- Integrated AI OCR parsing to extract vendor details, dates, and amounts from invoice files.
- Automated 3-way match checking against Purchase Orders and receipt logs.

### 4. 👥 HR & Payroll (Leave Management)
- **Leave Requests:** Standard employees can submit leaves, check their balances, and track status.
- **Admin Approvals:** Admins can approve/deny pending leaves in real-time, which automatically adjusts directories and ledger settings.
- **Payroll Engine:** Automates gross-to-net salary disbursements, ledger journal postings, and cost projections.

### 5. 📦 Supply Chain & Inventory
- Create and track Purchase Orders.
- Dynamic inventory level adjustments upon PO delivery confirmation.

### 6. 🧠 AI Demand Forecasting
- Integrated machine learning models to predict future sales, inventory requirements, and financial volatility.

### 7. 💼 Project Milestone Tracking
- Visual Gantt timeline charts.
- Task progress editor restricted to assignees and admins.

### 8. 🛡️ Identity, MFA & Compliance
- Cryptographic hash chains (SHA-256) verifying ledger audit trails to prevent data tampering.
- User account provisioning controls.
- Keycloak-like MFA simulation.

---

## 🛠️ Technology Stack

- **Frontend client:** React, TypeScript, Vite, Vanilla CSS.
- **Backend API Gateway:** NestJS (Node.js framework), Swagger OpenAPI, SQLite (using `better-sqlite3` for WAL mode) or PostgreSQL.
- **ML Engine:** Python, FastAPI, ML Forecasting scripts.

---

## 💻 Local Startup Instructions

We have provided a unified batch launcher script for simple local development:

1. Clone this repository to your local system.
2. Open a command prompt inside the project root directory.
3. Double-click or run the startup batch file:
   ```cmd
   start.bat
   ```
4. This script will launch:
   - **Vite Web Client:** [http://localhost:5173](http://localhost:5173)
   - **NestJS API Gateway:** [http://localhost:4005/api-docs](http://localhost:4005/api-docs) (Swagger documentation)
   - **Python ML Forecaster:** [http://localhost:8000/docs](http://localhost:8000/docs) (FastAPI documentation)