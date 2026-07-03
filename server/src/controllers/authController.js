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

  if (process.env.NODE_ENV === "development") {
    console.log(`\n🔑 DEV OTP for ${email}: ${otp}\n`);
  }

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
  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
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

  if (process.env.NODE_ENV === "development") {
    console.log(`\n🔑 DEV RESET OTP for ${email}: ${resetOTP}\n`);
  }

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
