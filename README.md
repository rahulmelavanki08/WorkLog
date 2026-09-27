# WorkLog — "FIND IT, PROVE IT"
> **Worker-First Digital Employment Platform for India's Informal Workforce**

WorkLog is a full-stack platform engineered to empower informal workers (masons, plumbers, electricians, carpenters, bar benders, etc.) and transparent contractors. It verifies daily attendance through **photo-based, timestamped, geotagged biometric check-ins**, automatically computes running wage ledgers, connects contractors with nearby skilled workers via the Haversine proximity formula, monitors real-time weather risks (extreme heat &gt;40°C and heavy rain via Open-Meteo), maintains a tamper-resistant **Trust Score Engine**, and generates AI-assisted dispute reports with 1-click official PDF exports.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS (Custom Color Theme: Deep Teal `#0F6E56`, Warm Coral `#D85A30`, Soft Indigo `#7F77DD`, Muted Green `#639922`), Lucide React, HTML5 Canvas / Camera API |
| **Backend** | Node.js, Express REST API, JWT Authentication, PDFKit Engine, Axios |
| **Database** | PostgreSQL 18, Prisma ORM (Schema, Migrations & Comprehensive Seed Script) |
| **Weather Safety** | Open-Meteo Free Real-Time Meteorological API (No API key required) |
| **Storage** | Modular `IStorageService` with local static `/uploads` service (swappable for S3/MinIO) |

---

## 🌟 Key Features by Role

### 1. 👷 Worker Role
- **Multi-Trade Registration**: Multi-select trade selector (Plumber, Electrician, Painter, Mason, Centering Worker, Carpenter, Welder, Bar Bender, Tile Layer, Helper/Unskilled Labor, Driver, Other [free text]), years of experience, and search radius slider (5–50 km).
- **Proximity Job Discovery (Haversine Formula)**: Real-time job feed matching worker trades, calculated in km from worker's GPS coordinates. Filterable by trade, radius, sort by nearest, highest wage, newest. 1-tap "Apply" with celebration confetti.
- **Direct Site Linking via Invite Code**: Enter contractor's 6-character alphanumeric code (e.g. `WL-METRO4`) to link directly to a project without going through a job posting.
- **Live Camera Check-In / Check-Out**:
  - Strictly enforces `navigator.mediaDevices.getUserMedia` live camera capture without file/gallery picker to prevent reusable photos.
  - Automatically attaches server-side timestamp and device GPS coordinates.
  - **Safety Check**: Automatically checks Open-Meteo weather for outdoor sites (construction, agriculture, roadwork). Shows hazard banners for extreme heat (&gt;40°C) or torrential rain with a 1-tap "Report Unsafe Condition" incident logger.
- **Automated Wage Ledger**: Daily attendance table with confirmation status, daily earned amount credited automatically upon contractor confirmation, payment log, and verified outstanding running balance.
- **Smart Dispute Assistant (AI Summary & PDF)**:
  - Generates neutral, plain-language wage dispute summaries following the strict 4-point prompt template.
  - 1-Click "Download as PDF" generating an official PDF packet with summary and evidence table via backend PDFKit.
- **Trust Score**: View reputation score (0–100) and history of increases (+3 per confirmed shift).

### 2. 🏗️ Contractor Role
- **Site Management**: Create worksites with GPS coordinates, site classification (`construction`, `agriculture`, `roadwork`, `retail`, `other`), and auto-generated direct invite codes & QR codes.
- **Post Skilled Jobs**: Form with trade requirements, wage offered (₹/day), workers needed, duration type, and site location.
- **Applicant Triage & 1-Tap Linking**: Applicant cards sorted by proximity distance and/or Trust Score, with 1-tap "Contact" (phone & WhatsApp link) and 1-tap "Accept & Link Worker".
- **Confirm Daily Attendance**: Queue showing worker selfies, server timestamps, and GPS coordinates. Confirm (awards worker +3 Trust Score and credits wages) or Flag as Mismatch with mandatory reason.
- **Payment Settlement Logging**: Record Cash / UPI payments (Full, Partial, Unpaid) with due dates. Full on-time payment grants **+5 Contractor Trust Score**; overdue payments penalize **-15 points**.
- **Contractor Trust Score**: View timeline of all compliance and payment score adjustments.

### 3. 🛡️ Admin Role (Central Labor Oversight)
- **Platform Analytics**: Total workers, contractors, sites, open disputes, and open safety reports.
- **Repeat Offender Radar**: Aggregate disputes and safety hazards chart per contractor to highlight non-compliant repeat offenders.
- **Dispute & Hazard Adjudication**: Full photographic and GPS evidence inspection with "Resolve" modal and labor determinations (with option to uphold mismatch against worker for -5 points).
- **Worker-Contractor Link Directory**: Non-destructive link revocation safeguard that halts future check-ins while preserving 100% of historical attendance and payment evidence.

---

## ⚡ Quick Start & Run Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **PostgreSQL**: PostgreSQL 14+ running on port `5432` with database `worklog_db`

### 1. Configure Environment Variables
Inside `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worklog_db?schema=public"
JWT_SECRET="worklog_super_secure_jwt_secret_2026_india_worker_first"
NODE_ENV=development
BASE_URL="http://localhost:5000"
```

### 2. Install Dependencies & Setup Database
```bash
# In backend directory:
cd backend
npm install
npx prisma db push
node prisma/seed.js

# In frontend directory:
cd ../frontend
npm install
```

### 3. Run Development Servers
```bash
# Start Backend API (runs on port 5000)
cd backend
npm start

# Start Frontend (runs on port 5173 with API proxy)
cd ../frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials (Instant 1-Click Login Available)

On the login page, you can click the **1-Click Instant Demo Login** buttons or use the following phone numbers with universal prototype OTP **`123456`**:

| Role | Name | Phone Number | Description / Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Worker 1** | Ramesh Kumar | `9800000001` | Mason & Bar Bender, 10 days attendance, partial payment, Trust Score: 94 |
| **Worker 2** | Suresh Verma | `9800000002` | Plumber & Welder, confirmed shifts, Trust Score: 98 |
| **Contractor 1** | Rajesh Sharma | `9876543210` | Apex Infra, 1 active site (Metro Pier 4), 2 jobs, pending attendance, Trust Score: 92 |
| **Contractor 2** | Vikram Patel | `9876543211` | Greenfield Constructions, Tech Park site, open electrician job, Trust Score: 95 |
| **Admin** | Officer Meera Sen | `9999999999` | Central Labor Oversight Officer, dispute resolution access |

*Universal Demo OTP for manual verification:* **`123456`**

---

## 🏛️ Database Schema Architecture (Prisma)

- `User`: Shared identity fields, phone, role (`WORKER`, `CONTRACTOR`, `ADMIN`), trustScore, profilePhoto.
- `WorkerProfile`: trades array, otherTrade, yearsExperience, searchRadius, home GPS.
- `Site`: contractorId, name, lat, lng, siteType (`construction`, `agriculture`, `roadwork`, `retail`, `other`), inviteCode.
- `JobPosting`: contractorId, siteId, title, requiredTrades, workersNeeded, dailyWage, startDate, durationType, lat, lng, status (`OPEN`, `FILLED`, `CLOSED`).
- `JobApplication`: jobId, workerId, appliedAt, status (`PENDING`, `CONTACTED`, `ACCEPTED`, `DECLINED`), distanceKm.
- `WorkerContractorLink`: workerId, contractorId, siteId, status (`PENDING`, `ACTIVE`, `REVOKED`).
- `AttendanceRecord`: workerId, siteId, jobId, date, checkInTime, checkOutTime, checkInPhoto, checkOutPhoto, checkInLat, checkInLng, confirmationStatus (`PENDING`, `CONFIRMED`, `FLAGGED`), flagReason, earnedAmount.
- `PaymentRecord`: workerId, contractorId, siteId, amount, mode (`CASH`, `UPI`), status (`FULL`, `PARTIAL`, `UNPAID`), date, dueDate, notes.
- `SafetyReport`: siteId, workerId, attendanceId, date, riskType (`extreme_heat`, `heavy_rain`, `structural_hazard`, etc.), temperature, weatherDescription, details, status (`PENDING`, `RESOLVED`), resolutionNote.
- `TrustScoreHistory`: userId, date, change, reason, resultingScore.
- `DisputeReport`: workerId, contractorId, siteId, startDate, endDate, generatedSummary, totalEarned, totalPaid, balance, linkedRecordIds.

---

## 📄 License
MIT License — WorkLog ("FIND IT, PROVE IT")
