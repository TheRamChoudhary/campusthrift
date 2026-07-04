import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import bgImage from "../assets/background_image.png";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", formData);
      const { token, user } = res.data.data;
      // Clear ALL cached query data so previous user's role/profile doesn't bleed into new session
      queryClient.clear();
      setAuth(user, token);
      toast.success("Login successful!");
      navigate("/marketplace");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>

      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] w-full max-w-md p-10 z-10 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover" />
            <h1 className="text-2xl font-bold text-white">CampusThrift</h1>
          </div>
          <p className="text-white/60 text-sm">NITT Student Platform</p>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              NITT Email
            </label>
            <input
              type="email"
              name="email"
              id="login-email"
              value={formData.email}
              onChange={handleChange}
              placeholder="205124076@nitt.edu"
              required
              className="w-full bg-[#121212] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition"
            />
          </div>

          {/* Password with show/hide */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-white/70">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-white/60 hover:text-white transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full bg-[#121212] border border-[#333333] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
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
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black font-bold py-3.5 rounded-full transition-all duration-200 mt-4"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-white font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
