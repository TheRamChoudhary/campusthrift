import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: formData.email,
      });
      toast.success(res.data.message || "OTP sent successfully!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.otp || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });
      toast.success(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
      <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-xl  w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#58a6ff]">CampusThrift</h1>
          <p className="text-[#8b949e] text-sm mt-1">NITT Student Platform</p>
        </div>

        <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">
          Password Recovery
        </h2>
        <p className="text-[#8b949e] text-xs mb-6">
          {step === 1
            ? "Enter your official @nitt.edu student email to receive a recovery code."
            : "Enter the 6-digit OTP code sent to your email and set a new secure password."}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8b949e] mb-1">
                NITT Student Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. 205124076@nitt.edu"
                required
                className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Sending Recovery Code..." : "Send Recovery OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8b949e] mb-1">
                OTP Verification Code
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="6-digit code"
                required
                maxLength={6}
                className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff] text-center font-bold tracking-widest text-[#58a6ff]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8b949e] mb-1">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8b949e] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] hover:bg-[#30363d]/50 text-[#8b949e] font-semibold py-2.5 rounded-lg transition text-center text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-[#8b949e] mt-6">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-[#58a6ff] font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
