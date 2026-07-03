import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1); // 1: register, 2: verify otp
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.email.endsWith("@nitt.edu")) {
      toast.error("Only @nitt.edu emails are allowed");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success("OTP sent! Check your NITT webmail inbox.");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      });
      const { token, user } = res.data.data;
      setAuth(user, token);
      toast.success("Email verified! Welcome to CampusThrift 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
      <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#58a6ff]">CampusThrift</h1>
          <p className="text-[#8b949e] text-sm mt-1">NITT Student Platform</p>
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-6">Create Account</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="register-name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
              </div>

              {/* NITT Email */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-1">
                  NITT Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="register-email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="205124076@nitt.edu"
                  required
                  className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
                <p className="text-[10px] text-[#8b949e] mt-1">
                  Only <span className="font-bold text-[#58a6ff]">@nitt.edu</span> email addresses are allowed.
                </p>
              </div>

              {/* Password with show/hide */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="register-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.95 9.95 0 016.375 2.325M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Create Account"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">Verify Email</h2>

            {/* Webmail notice banner */}
            <div className="bg-[#388bfd]/10 border border-[#388bfd]/30 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
              <span className="text-xl mt-0.5">📬</span>
              <div>
                <p className="text-sm font-bold text-[#58a6ff]">OTP sent to your NITT Webmail</p>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  A 6-digit OTP has been sent to{" "}
                  <span className="font-semibold text-[#c9d1d9]">{formData.email}</span>.
                  Open your NITT webmail at{" "}
                  <a
                    href="https://webmail.nitt.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#58a6ff] underline font-semibold"
                  >
                    webmail.nitt.edu
                  </a>{" "}
                  and check your inbox.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  name="otp"
                  id="register-otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
                <p className="text-[10px] text-[#8b949e] mt-1 text-center">
                  OTP expires in <span className="font-bold text-amber-500">10 minutes</span>. Check spam folder if not visible.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-[#8b949e] hover:text-[#58a6ff] transition"
              >
                ← Back to Register
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-[#8b949e] mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#58a6ff] font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
