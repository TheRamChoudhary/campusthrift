require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const listingRoutes = require("./routes/listing.routes");
const requestRoutes = require("./routes/request.routes");
const authRoutes = require("./routes/auth.routes");
const paymentRoutes = require("./routes/payment.routes");
const stripeRoutes = require("./routes/stripe.routes");
const chatRoutes = require("./routes/chat.routes");
const adminRoutes = require("./routes/admin.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// Security middleware
app.use(helmet());

// CORS — restrict to CLIENT_URL in production, permissive in development
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL
    : true,
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting — stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logging — only in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "CampusThrift API is running" });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/payments/stripe", stripeRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", feedbackRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("🔥 Error:", err);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
