const User = require("../models/User");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route GET /api/v1/admin/analytics
// Aggregate administrative metrics and financial analytics
exports.getAnalytics = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const blockedUsers = await User.countDocuments({ isBlocked: true });

  const totalListings = await Listing.countDocuments();
  const availableListings = await Listing.countDocuments({
    status: "available",
  });
  const soldListings = await Listing.countDocuments({ status: "sold" });

  // Revenue Aggregation
  const revenueAgg = await Transaction.aggregate([
    { $match: { type: "purchase", status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  // Category Distribution
  const categoryDistribution = await Listing.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  // Daily Sales Volume (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const salesHistory = await Transaction.aggregate([
    {
      $match: {
        type: "purchase",
        status: "completed",
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          blocked: blockedUsers,
        },
        listings: {
          total: totalListings,
          available: availableListings,
          sold: soldListings,
        },
        revenue: totalRevenue,
        categories: categoryDistribution,
        salesHistory,
      },
      "Analytics aggregated successfully",
    ),
  );
});

// @route GET /api/v1/admin/users
// Retrieve user catalog for administration
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

// @route PUT /api/v1/admin/users/:id/toggle-block
// Suspend or reinstate user privileges
exports.toggleBlockUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot block your own account");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  // Log in Audit Logs
  await AuditLog.create({
    action: user.isBlocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
    performedBy: req.user._id,
    ipAddress: req.ip || "127.0.0.1",
    details: `${user.isBlocked ? "Suspended" : "Reinstated"} student account: "${user.name}" (${user.email}).`,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        `User successfully ${user.isBlocked ? "blocked" : "unblocked"}`,
      ),
    );
});

// @route GET /api/v1/admin/audit-logs
// Get system-wide audit logs
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const logs = await AuditLog.find()
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(100);

  res
    .status(200)
    .json(new ApiResponse(200, logs, "System audit logs fetched successfully"));
});

// @route DELETE /api/v1/admin/listings/:id
// Moderator action to forcefully delete flagged/fraudulent listings
exports.deleteListingModerator = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }

  const title = listing.title;
  await listing.deleteOne();

  // Log action
  await AuditLog.create({
    action: "LISTING_DELETED_MODERATION",
    performedBy: req.user._id,
    ipAddress: req.ip || "127.0.0.1",
    details: `Moderator deleted flagged listing "${title}" (ID: ${id}) from the platform.`,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Listing deleted by moderation successfully"),
    );
});

// @route POST /api/v1/admin/create-special-account
// Provision club or local vendor account (Admin only)
exports.createSpecialAccount = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Please provide name, email, password, and role");
  }

  if (!["vendor", "club", "moderator"].includes(role)) {
    throw new ApiError(
      400,
      "Invalid role. Role must be vendor, club, or moderator",
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Create the verified account directly
  const specialAccount = await User.create({
    name,
    email,
    password,
    role,
    isVerified: true, // Pre-verified since created by Admin
  });

  // Log in Audit Logs
  await AuditLog.create({
    action: "SPECIAL_ACCOUNT_CREATED",
    performedBy: req.user._id,
    ipAddress: req.ip || "127.0.0.1",
    details: `Admin provisioned special account: "${name}" (${email}) with role "${role.toUpperCase()}".`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: specialAccount._id,
        name: specialAccount.name,
        email: specialAccount.email,
        role: specialAccount.role,
        isVerified: specialAccount.isVerified,
      },
      `Special verified ${role} account created successfully`,
    ),
  );
});
