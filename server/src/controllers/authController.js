const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const OTP = require("../models/OTP");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  sendOTPEmail,
  sendResetPasswordEmail,
} = require("../services/emailService");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// @route POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email.endsWith("@nitt.edu")) {
    throw new ApiError(400, "Only NITT student emails are allowed");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({ name, email, password });

  const otp = generateOTP();
  await OTP.create({ email, otp });

  let emailSent = false;
  try {
    await sendOTPEmail(email, otp);
    emailSent = true;
  } catch (emailError) {
    console.log(
      "Email sending failed (dev mode - use terminal OTP):",
      emailError.message,
    );
  }

  const responseData = { email };

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        responseData,
        emailSent
          ? "Registration successful. Check your email for OTP."
          : "Registration successful. OTP printed to server terminal (email failed).",
      ),
    );
});

// @route POST /api/v1/auth/verify-otp
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  const isTargetAdmin = email && (email.toLowerCase() === "205124076@nitt.edu" || email.toLowerCase() === "20514076@nitt.edu");
  const updateData = { isVerified: true };
  if (isTargetAdmin) {
    updateData.role = "admin";
  }

  const user = await User.findOneAndUpdate(
    { email },
    updateData,
    { returnDocument: "after" },
  );

  await OTP.deleteMany({ email });

  const token = generateToken(user._id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        "Email verified successfully",
      ),
    );
});

// @route POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Auto-elevate target emails to admin
  const isTargetAdmin = email && (email.toLowerCase() === "205124076@nitt.edu" || email.toLowerCase() === "20514076@nitt.edu");
  if (isTargetAdmin && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  const token = generateToken(user._id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        "Login successful",
      ),
    );
});

// @route GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

// @route POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please provide an email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Return 200 even when email not found — prevents email enumeration attacks
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "If an account with that email exists, a password reset OTP has been sent.",
        ),
      );
  }

  // Generate secure 6-digit OTP code
  const resetOTP = generateOTP();

  // Securely hash the OTP token before storing in database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetOTP)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  await user.save();

  let emailSent = false;
  try {
    await sendResetPasswordEmail(email, resetOTP);
    emailSent = true;
  } catch (emailError) {
    console.log(
      "Reset Password email sending failed (dev mode - use terminal OTP):",
      emailError.message,
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        emailSent
          ? "Password reset OTP code sent to your email."
          : "Password reset OTP code generated. Check your server terminal (email failed).",
      ),
    );
});

// @route POST /api/v1/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    throw new ApiError(400, "Please provide email, OTP code, and new password");
  }

  // Hash the incoming OTP and look for a matching non-expired record in the database
  const hashedToken = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired OTP code");
  }

  // Update password (pre-save hook will hash it)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successfully. You can now login with your new password.",
      ),
    );
});

// @route PUT /api/v1/auth/profile
// Update user profile settings
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, avatar, bio, department, branch, hostel, phone } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (department !== undefined) user.department = department;
  if (branch !== undefined) user.branch = branch;
  if (hostel !== undefined) user.hostel = hostel;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        department: user.department,
        branch: user.branch,
        hostel: user.hostel,
        phone: user.phone,
      },
      "Profile updated successfully",
    )
  );
});
