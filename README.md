# 🎓 CampusThrift — NITT Student Marketplace

A full-stack peer-to-peer marketplace built exclusively for NIT Trichy students to buy, sell, and trade second-hand items within the campus community.

---

## ✨ Features

- 🔐 **NITT-only Auth** — Registration restricted to `@nitt.edu` email addresses with OTP verification via NITT Webmail
- 🛍️ **Listings** — Create, browse, search, and filter second-hand items by category, price, and condition
- 💬 **Real-time Chat** — Socket.io-powered direct messaging between buyers and sellers
- 💳 **Payments** — Stripe-integrated secure in-platform payment flow
- ⭐ **Trust Score System** — Sellers earn an aggregate Trust Score from anonymous confidential buyer reviews
- 📊 **Dashboard** — Track your listings, purchase requests, and transaction history
- 🔔 **Notifications** — Real-time alerts for requests, messages, and status updates
- 📋 **Admin Panel** — Manage users, listings, complaints, and resolve disputes
- 🛡️ **Feedback & Complaints** — Submit bugs, rate sellers anonymously, or report inappropriate users/sellers
- 📱 **Fully Responsive** — Mobile-first design with hamburger nav and touch-optimised UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, TanStack React Query |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Real-time** | Socket.io |
| **Auth** | JWT + OTP (NITT Webmail) |
| **Email** | Brevo HTTP API (works on college Wi-Fi) |
| **Images** | Cloudinary |
| **Payments** | Stripe |
| **Hosting** | GCP Cloud Run (backend) + Vercel (frontend) |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- MongoDB running locally
- Brevo account (free tier — for OTP emails)
- Cloudinary account (free tier — for image uploads)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/campus-thrift.git
cd campus-thrift
```

### 2. Setup Server
```bash
cd server
cp .env.production.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
campus_thrift/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/      # Shared UI components
│   │   │   ├── features/    # Feature-specific components
│   │   │   └── layout/      # Navbar, Layout wrappers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route-level page components
│   │   ├── store/           # Zustand auth store
│   │   └── utils/           # Constants and helpers
│   ├── vercel.json          # Vercel SPA routing config
│   └── vite.config.js
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Route handler logic
│   │   ├── middleware/       # Auth, upload middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Email, Socket.io, Cron
│   │   └── utils/           # ApiError, ApiResponse helpers
│   ├── Dockerfile           # GCP Cloud Run container
│   ├── .dockerignore
│   └── .env.production.example  # Environment variable template
│
└── docker-compose.yml       # Local full-stack development
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `client`
4. Add environment variable: `VITE_API_URL=https://your-gcp-backend-url/api/v1`

### Backend → GCP Cloud Run
1. Install and authenticate [gcloud CLI](https://cloud.google.com/sdk)
2. Build and push the container:
```bash
cd server
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/campusthrift-server
```
3. Deploy:
```bash
gcloud run deploy campusthrift-server \
  --image gcr.io/YOUR_PROJECT_ID/campusthrift-server \
  --platform managed --region us-central1 \
  --allow-unauthenticated --port 8080
```
4. Set environment variables in Cloud Run console (use `.env.production.example` as template)

---

## 🔒 Environment Variables

See [`server/.env.production.example`](./server/.env.production.example) for all required variables.

> ⚠️ Never commit your actual `.env` file. It is excluded by `.gitignore`.

---

## 👨‍💻 Author

**Ram Choudhary** — NIT Trichy
