# 📡 ISP Management System – Next-Gen Network Administration

[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![WhatsApp API](https://img.shields.io/badge/WhatsApp_API-Integration-25D366?style=for-the-badge&logo=whatsapp)](https://business.whatsapp.com/)

> **Powered By**: [Minhal Awais](https://minhalawais.me/) | [LinkedIn](https://linkedin.com/in/minhal-awais-601216227)

---

## 🚀 Experience the Solution

The **ISP Management System** is a comprehensive, enterprise-grade ERP designed specifically for Internet Service Providers. It unifies customer lifecycle management, automated billing, network hardware integration (MikroTik/Ubiquiti), and field force operations into a single, cohesive platform.

Built to handle scale, it manages everything from complex recurring billing cycles to real-time inventory tracking and automated WhatsApp notifications.

## 🌟 Key Components

### 1. Smart Billing & Recovery Engine
A robust financial core that automates the revenue cycle.
*   **Automated Invoicing**: Generates subscription, installation, and equipment invoices.
*   **Recovery Task Force**: Automatically assigns overdue invoices to Recovery Agents with "Promise to Pay" tracking.
*   **Dynamic Plans**: Supports bandwidth-based billing, flat rates, and custom corporate packages.
*   **ISP Payment Tracking**: Manages upstream bandwidth costs and operational expenses.

### 2. Network & Hardware Integration
Direct control over the physical infrastructure.
*   **Vendor Agnostic**: Seamlessly integrates with **MikroTik** and **Ubiquiti** devices via custom adapters.
*   **Inventory Management**: serialized tracking of Routers, ONUs, Patch Cords, and Splicing Boxes.
*   **Geo-Tagged Infrastructure**: Maps customers to specific Areas and Sub-zones for outage tracking.

### 3. CRM & Customer 360° Profile
A complete view of every subscriber.
*   **Deep Technical Profiling**: Tracks fiber length, connection type, MAC addresses, and equipment ownership.
*   **Document Vault**: Stores CNIC images, agreement forms, and installation proofs.
*   **Geolocation**: Exact GPS coordinates for installation sites to aid technicians.

### 4. Automated Communication Hub
Built-in WhatsApp marketing and notification system.
*   **Message Queueing**: Intelligent priority queue for high-volume message delivery.
*   **Template Engine**: Dynamic templates for invoices, deadline alerts, and promotions.
*   **Quota Management**: Automatic handling of daily sending limits to prevent blocking.

### 5. Financial Ledger & HR
Integrated accounting for staff and operations.
*   **Employee Ledgers**: Tracks salaries, commissions per new connection, and recovery incentives.
*   **Expense Management**: Dynamic expense categorization and bank account reconciliation.
*   **Internal Transfers**: Manage funds between company bank accounts.

---

## 🔐 User Roles & Governance

The platform features a granular **Role-Based Access Control (RBAC)** system.

| Role | Access Level | Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | Full System Access | System configuration, financial auditing, critical deletions. |
| **Company Owner** | Corporate Dashboard | Strategic oversight, P&L monitoring, staff management. |
| **Manager** | Operational Control | Approvals, inventory restocking, team assignments. |
| **Recovery Agent** | Recovery Portal | Viewing assigned overdue invoices, logging recovery attempts. |
| **Technician** | Field App | Viewing installation orders, updating inventory usage, closing tickets. |
| **Customer** | Self-Service Portal | Viewing invoices, downloading usage reports, submitting complaints. |

---

## 🛠️ Technology Stack

Designed for reliability, performance, and maintainability.

### Frontend (Client Client)
*   **Framework**: React 19 + TypeScript
*   **UI System**: Ant Design (Data intensive views) + Material UI + Tailwind CSS
*   **Visualization**: Recharts (Financial reporting) + Leaflet (Map integration)
*   **State/Data**: React Query / SWR

### Backend (API Server)
*   **Framework**: Python Flask
*   **ORM**: SQLAlchemy (Async capabilities)
*   **Database**: PostgreSQL (Leveraging UUIDs & JSONB)
*   **Task Queue**: Custom Scheduler for billing cycles & WhatsApp
*   **Hardware Interface**: Python-API interactions for RouterOS & UniFi

---

## 💻 Local Development

The project is split into two distinct parts: `src` (Frontend) and `api` (Backend).

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   PostgreSQL

### 1. Backend Setup
Navigate to the API directory and start the Flask server.

```bash
cd api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
flask run
```

### 2. Frontend Setup
Navigate to the root directory to start the React application.

```bash
npm install
npm start
```

### 3. Environment Configuration
Ensure you create a `.env` file in the `api` folder with the following keys:
```env
DATABASE_URL=postgresql://user:password@localhost/isp_db
SECRET_KEY=your_secret_key
WHATSAPP_API_TOKEN=your_token
```

---

<div align="center">
  <p>Developed with ❤️ by <a href="https://minhalawais.me/">Minhal Awais</a></p>
  </div>
