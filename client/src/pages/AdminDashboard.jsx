import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, users, logs, listings

  const [provisionForm, setProvisionForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "club",
  });

  const handleProvisionChange = (e) => {
    setProvisionForm({ ...provisionForm, [e.target.name]: e.target.value });
  };

  const provisionMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/admin/create-special-account", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(`Verified ${data.role} account created successfully!`);
      setProvisionForm({ name: "", email: "", password: "", role: "club" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Provisioning failed");
    },
  });

  const handleProvisionSubmit = (e) => {
    e.preventDefault();
    if (provisionForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    provisionMutation.mutate(provisionForm);
  };

  // 1. Access Control: Fetch current profile & verify role
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data;
    },
  });

  // 2. Fetch System Analytics (Admins & Moderators)
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data.data;
    },
    enabled: !!profile && ["admin", "moderator"].includes(profile.role),
  });

  // 3. Fetch User Directory (Admins & Moderators)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data.data;
    },
    enabled: !!profile && ["admin", "moderator"].includes(profile.role),
  });

  // 4. Fetch Audit Logs (Admins Only)
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await api.get("/admin/audit-logs");
      return res.data.data;
    },
    enabled: !!profile && profile.role === "admin",
  });

  // 5. Fetch Listings for Moderation (Admins & Moderators)
  const { data: listingsData, isLoading: isLoadingListings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const res = await api.get("/listings");
      return res.data.data;
    },
    enabled: !!profile && ["admin", "moderator"].includes(profile.role),
  });

  // Fetch Complaints/Feedback (Admins & Moderators)
  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const res = await api.get("/feedback/admin");
      return res.data.data;
    },
    enabled: !!profile && ["admin", "moderator"].includes(profile.role),
  });

  // Action Mutation: Update complaint status
  const updateComplaintStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/feedback/${id}`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Complaint status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update complaint status");
    },
  });

  const findUserByRollNo = (rollNo) => {
    if (!rollNo) return null;
    return users.find((u) => u.email && u.email.toLowerCase().startsWith(rollNo.toLowerCase()));
  };

  // 6. Action Mutation: Toggle Block User account (Admin only)
  const blockMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.put(`/admin/users/${userId}/toggle-block`);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Account status updated: ${data.isBlocked ? "Blocked" : "Unblocked"}`,
      );
      // Invalidate all queries globally so that blocked users' listings disappear from all feeds instantly
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Unauthorized action");
    },
  });

  // 7. Action Mutation: Delete inappropriate listings (Moderator/Admin)
  const deleteListingMutation = useMutation({
    mutationFn: async (listingId) => {
      const res = await api.delete(`/admin/listings/${listingId}`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Listing permanently deleted via moderation");
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete listing");
    },
  });

  // Guards
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Strictly block non-authorized users
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    toast.error("Access Denied: Administrative privileges required");
    return <Navigate to="/dashboard" />;
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Portal Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#c9d1d9] tracking-tight flex items-center gap-2">
            <span>🛡️</span> University Control Panel
          </h1>
          <p className="text-xs text-[#8b949e] font-bold tracking-wide uppercase mt-1">
            NIT Tiruchirappalli Campus Portal • Role:{" "}
            <span className="text-[#58a6ff] font-black">
              {profile.role.toUpperCase()}
            </span>
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl p-1.5 shadow-2xl mb-8 flex-wrap gap-1.5 w-full">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
              activeTab === "analytics"
                ? "bg-[#238636] text-white shadow-xl"
                : "text-[#8b949e] hover:text-white hover:bg-white/5"
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
              activeTab === "users"
                ? "bg-[#238636] text-white shadow-xl"
                : "text-[#8b949e] hover:text-white hover:bg-white/5"
            }`}
          >
            👥 Students
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
              activeTab === "listings"
                ? "bg-[#238636] text-white shadow-xl"
                : "text-[#8b949e] hover:text-white hover:bg-white/5"
            }`}
          >
            🛍️ Listings
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
              activeTab === "complaints"
                ? "bg-[#238636] text-white shadow-xl"
                : "text-[#8b949e] hover:text-white hover:bg-white/5"
            }`}
          >
            🚨 Complaints
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
                activeTab === "logs"
                  ? "bg-[#238636] text-white shadow-xl"
                  : "text-[#8b949e] hover:text-white hover:bg-white/5"
              }`}
            >
              📜 Audit Logs
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab("provision")}
              className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold rounded-xl transition text-center ${
                activeTab === "provision"
                  ? "bg-[#238636] text-white shadow-xl"
                  : "text-[#8b949e] hover:text-white hover:bg-white/5"
              }`}
            >
              🔑 Provision Accounts
            </button>
          )}
        </div>

        {/* -------------------- STATS TAB -------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {isLoadingAnalytics ? (
              <div className="text-center py-20 text-gray-400">
                Aggregating platform statistics...
              </div>
            ) : !analytics ? (
              <div className="text-center py-20 text-red-500">
                Failed to aggregate statistics
              </div>
            ) : (
              <>
                {/* Metric Widgets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Widget: Users */}
                  <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] p-5 rounded-2xl border border-[#30363d] shadow-2xl  space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Total Registrants
                    </p>
                    <h3 className="text-3xl font-black text-slate-800">
                      {analytics.users?.total}
                    </h3>
                    <div className="flex gap-3 text-[10px] text-[#8b949e] font-semibold pt-2 border-t border-gray-50">
                      <span className="text-emerald-600">
                        ✓ {analytics.users?.verified} Verified
                      </span>
                      <span className="text-red-500">
                        ✗ {analytics.users?.blocked} Blocked
                      </span>
                    </div>
                  </div>

                  {/* Widget: Listings */}
                  <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] p-5 rounded-2xl border border-[#30363d] shadow-2xl  space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Total Product Listings
                    </p>
                    <h3 className="text-3xl font-black text-slate-800">
                      {analytics.listings?.total}
                    </h3>
                    <div className="flex gap-3 text-[10px] text-[#8b949e] font-semibold pt-2 border-t border-gray-50">
                      <span className="text-[#58a6ff]">
                        ⚡ {analytics.listings?.available} Available
                      </span>
                      <span className="text-gray-400">
                        ✓ {analytics.listings?.sold} Sold
                      </span>
                    </div>
                  </div>

                  {/* Widget: Revenue */}
                  <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] p-5 rounded-2xl border border-[#30363d] shadow-2xl  space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Gross Transaction Volume
                    </p>
                    <h3 className="text-3xl font-black text-emerald-600">
                      ₹{analytics.revenue?.toLocaleString("en-IN")}
                    </h3>
                    <p className="text-[9px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100/30">
                      Real Stripe API mock session activity
                    </p>
                  </div>

                  {/* Widget: Access Type */}
                  <div className="bg-gradient-to-tr from-slate-800 to-indigo-900 p-5 rounded-2xl text-white shadow-xl  relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d]/5 rounded-full -mr-6 -mt-6 blur-lg"></div>
                    <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">
                      Moderation Level
                    </p>
                    <div>
                      <h3 className="text-lg font-black tracking-tight mt-1">
                        {profile.role.toUpperCase()} LEVEL
                      </h3>
                      <p className="text-[10px] text-indigo-200/80 leading-normal mt-0.5">
                        {isAdmin
                          ? "Full administrative control: block students, moderate items, access system-wide audit registers."
                          : "Moderation level: view catalog metrics, examine student list, flag and erase listings."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Custom Graphs & Breakdown Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category distributions */}
                  <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] p-6 shadow-2xl ">
                    <h3 className="text-sm font-bold text-[#c9d1d9] mb-4 flex items-center gap-1.5">
                      <span>🏷️</span> Category Distribution Breakdown
                    </h3>
                    <div className="space-y-4">
                      {analytics.categories?.map((cat) => {
                        const total = analytics.listings?.total || 1;
                        const percentage = Math.round(
                          (cat.count / total) * 100,
                        );
                        return (
                          <div key={cat._id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-[#8b949e]">
                              <span>{cat._id || "Uncategorized"}</span>
                              <span className="font-mono text-gray-400">
                                {cat.count} listings ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="bg-[#238636] h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily transactions logs */}
                  <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] p-6 shadow-2xl ">
                    <h3 className="text-sm font-bold text-[#c9d1d9] mb-4 flex items-center gap-1.5">
                      <span>📈</span> Sales Volume Activity Feed (Last 7 Days)
                    </h3>
                    {analytics.salesHistory?.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-xs font-medium">
                        No sales recorded this week.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {analytics.salesHistory?.map((day) => (
                          <div
                            key={day._id}
                            className="flex items-center justify-between py-2 border-b border-dashed border-[#30363d]"
                          >
                            <div>
                              <p className="text-xs font-bold text-[#8b949e]">
                                {day._id}
                              </p>
                              <p className="text-[10px] text-gray-400 font-semibold">
                                {day.count} transaction(s) settled
                              </p>
                            </div>
                            <span className="text-sm font-black text-emerald-600">
                              ₹{day.revenue?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------- USERS TAB -------------------- */}
        {activeTab === "users" && (
          <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-[#c9d1d9]">
                Student Directory Register
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Active list of students on the @nitt.edu domain
              </p>
            </div>

            {isLoadingUsers ? (
              <div className="text-center py-12 text-xs text-gray-400 font-medium">
                Fetching directory...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                No registered students found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-[#30363d] text-gray-400 uppercase tracking-wider font-extrabold text-[9px]">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center">Status</th>

                      {isAdmin && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#388bfd]/10 border flex items-center justify-center font-bold text-[11px] text-[#58a6ff] uppercase">
                              {student.name?.[0]}
                            </div>
                            <span className="font-bold text-[#c9d1d9]">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#8b949e]">
                          {student.email}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide border ${
                              student.role === "admin"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : student.role === "moderator"
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : "bg-slate-100 text-[#8b949e] border-slate-200"
                            }`}
                          >
                            {student.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {student.isBlocked ? (
                              <span className="bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full text-[9px] border border-red-200 animate-pulse">
                                Account Blocked
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full text-[9px] border border-emerald-200">
                                Active & Free
                              </span>
                            )}

                            {student.isVerified ? (
                              <span className="text-[8px] font-bold text-emerald-500">
                                OTP Verified Domain
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-yellow-500">
                                Unverified
                              </span>
                            )}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="p-4 text-right">
                            {student._id === profile.id ? (
                              <span className="text-gray-400 italic text-[10px] font-medium pr-3">
                                You (Self)
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  blockMutation.mutate(student._id)
                                }
                                disabled={blockMutation.isPending}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition ${
                                  student.isBlocked
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {student.isBlocked
                                  ? "🔓 Reinstate"
                                  : "🔒 Block Student"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- LISTINGS MODERATION TAB -------------------- */}
        {activeTab === "listings" && (
          <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-[#c9d1d9]">
                Product Listings Registry
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Remove or moderate listed assets directly
              </p>
            </div>

            {isLoadingListings ? (
              <div className="text-center py-12 text-xs text-gray-400 font-medium">
                Fetching active listings...
              </div>
            ) : !listingsData?.listings ||
              listingsData.listings.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                No listings posted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-[#30363d] text-gray-400 uppercase tracking-wider font-extrabold text-[9px]">
                      <th className="p-4">Asset Details</th>
                      <th className="p-4">Category / Condition</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Seller Info</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listingsData.listings.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-50 rounded-lg border flex items-center justify-center text-sm flex-shrink-0">
                                📦
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#c9d1d9] truncate max-w-[200px]">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <span className="bg-slate-100 text-[#8b949e] font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wide mr-1 border border-slate-200">
                            {item.category}
                          </span>
                          <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wide border border-blue-100">
                            {item.condition}
                          </span>
                        </td>
                        <td className="p-4 font-bold font-mono text-[#58a6ff]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </td>
                        <td className="p-4 leading-normal">
                          <p className="font-bold text-[#8b949e]">
                            {item.seller?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold">
                            {item.seller?.email}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                              item.status === "available"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : item.status === "sold"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you absolutely sure you want to moderate and delete the listing "${item.title}"?`,
                                )
                              ) {
                                deleteListingMutation.mutate(item._id);
                              }
                            }}
                            disabled={deleteListingMutation.isPending}
                            className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-black px-3 py-1.5 rounded-lg text-[10px] transition"
                          >
                            🗑️ Erase Item
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- AUDIT LOGS TAB (ADMINS ONLY) -------------------- */}
        {activeTab === "logs" && isAdmin && (
          <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-[#c9d1d9]">
                System Structural Audit Logs
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Record of administrative, database, and webhook events
              </p>
            </div>

            {isLoadingLogs ? (
              <div className="text-center py-12 text-xs text-gray-400 font-medium">
                Reading audit register...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                No audit logs written.
              </div>
            ) : (
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {auditLogs.map((log) => {
                  let alertColor = "bg-transparent border-[#30363d]";
                  let badgeIcon = "⚙️";

                  if (
                    log.action === "USER_BLOCKED" ||
                    log.action === "LISTING_DELETED_MODERATION"
                  ) {
                    alertColor = "bg-red-50/30 border-red-100/50 text-red-800";
                    badgeIcon = "🔒";
                  } else if (log.action === "USER_UNBLOCKED") {
                    alertColor =
                      "bg-green-50/30 border-green-100/50 text-green-800";
                    badgeIcon = "🔓";
                  } else if (log.action.includes("PAYMENT")) {
                    alertColor =
                      "bg-emerald-50/30 border-emerald-100/50 text-emerald-800";
                    badgeIcon = "💳";
                  }

                  return (
                    <div
                      key={log._id}
                      className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition hover:shadow-2xl  ${alertColor}`}
                    >
                      <span className="text-lg flex-shrink-0">{badgeIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-extrabold tracking-wide uppercase text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="leading-relaxed font-medium mt-1">
                          {log.details}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100/50 flex flex-wrap items-center justify-between text-[9px] text-gray-400 font-semibold uppercase">
                          <span>
                            👤 By: {log.performedBy?.name || "System Auto"} (
                            {log.performedBy?.role || "SYSTEM"})
                          </span>
                          <span className="font-mono">
                            🖥️ IP: {log.ipAddress}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------- PROVISION ACCOUNTS TAB (ADMINS ONLY) -------------------- */}
        {activeTab === "provision" && isAdmin && (
          <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  overflow-hidden max-w-lg mx-auto">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-[#c9d1d9]">
                Provision Special Verified Account
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Create custom non-student accounts for campus clubs, vendors or
                moderators
              </p>
            </div>

            <form onSubmit={handleProvisionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-1">
                  Account Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. IQ Club, Canteen Main"
                  required
                  value={provisionForm.name}
                  onChange={handleProvisionChange}
                  className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. iqclub@nitt.edu, canteen@gmail.com"
                  required
                  value={provisionForm.email}
                  onChange={handleProvisionChange}
                  className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  required
                  value={provisionForm.password}
                  onChange={handleProvisionChange}
                  className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-1">
                  Privilege Level / Role
                </label>
                <select
                  name="role"
                  value={provisionForm.role}
                  onChange={handleProvisionChange}
                  className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d]"
                >
                  <option value="club">
                    Campus Club (e.g. @nitt.edu clubs)
                  </option>
                  <option value="vendor">
                    Local Vendor (external campus merchants)
                  </option>
                  <option value="moderator">
                    Moderator (listings moderation support)
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={provisionMutation.isPending}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 rounded-xl transition shadow-2xl  hover:shadow-indigo-500/10 text-xs sm:text-sm disabled:opacity-50"
              >
                {provisionMutation.isPending
                  ? "Provisioning Account..."
                  : "🔑 Provision Verified Account"}
              </button>
            </form>
          </div>
        )}

        {/* -------------------- COMPLAINTS TAB -------------------- */}
        {activeTab === "complaints" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl p-5 shadow-2xl">
              <h3 className="text-sm font-extrabold text-[#c9d1d9]">
                User Complaints & Support Center
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Review platform issues, suggestions, or user violation reports.
              </p>
            </div>

            {isLoadingComplaints ? (
              <div className="text-center py-12 text-xs text-gray-400 font-medium">
                Loading support tickets...
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl">
                No complaints or support tickets found.
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((item) => {
                  const reportedStudent = item.targetRollNo ? findUserByRollNo(item.targetRollNo) : null;

                  return (
                    <div
                      key={item._id}
                      className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl p-5 hover:shadow-xl transition"
                    >
                      {/* Ticket header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-[#30363d] pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                              item.type === "bug"
                                ? "bg-rose-100/10 text-rose-500 border-rose-500/20"
                                : item.type === "suggestion"
                                  ? "bg-green-100/10 text-green-500 border-green-500/20"
                                  : "bg-amber-100/10 text-amber-500 border-amber-500/20"
                            }`}
                          >
                            {item.type} {item.subType ? `(${item.subType})` : ""}
                          </span>
                          <h4 className="font-extrabold text-sm text-[#c9d1d9]">
                            {item.subject}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-medium">
                            Status:
                          </span>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              updateComplaintStatusMutation.mutate({
                                id: item._id,
                                status: e.target.value,
                              })
                            }
                            disabled={updateComplaintStatusMutation.isPending}
                            className="bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-[10px] font-bold text-[#c9d1d9]"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      {/* Submitted By */}
                      <div className="text-[10px] text-gray-450 font-medium mb-3">
                        Submitted by: <span className="text-indigo-400 font-bold">{item.user?.name}</span> ({item.user?.email}) · {new Date(item.createdAt).toLocaleDateString()}
                      </div>

                      {/* Ticket Description */}
                      <p className="text-xs text-[#8b949e] bg-transparent p-3 rounded-xl border border-[#30363d] leading-relaxed mb-4">
                        {item.description}
                      </p>

                      {/* If User Complaint, show offender actions */}
                      {item.targetRollNo && (
                        <div className="bg-[#30363d]/10 border border-[#30363d] rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🚨</span>
                            <span className="text-xs font-bold text-rose-400">
                              Reported User: Roll No {item.targetRollNo}
                            </span>
                          </div>

                          {reportedStudent ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                              <div>
                                <p className="font-bold text-[#c9d1d9]">
                                  Identified: {reportedStudent.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {reportedStudent.email}
                                </p>
                              </div>
                              <div>
                                <button
                                  onClick={() => blockMutation.mutate(reportedStudent._id)}
                                  disabled={blockMutation.isPending}
                                  className={`text-[10px] font-black px-3.5 py-2 rounded-xl border transition ${
                                    reportedStudent.isBlocked
                                      ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                                      : "bg-red-600 hover:bg-red-700 text-white border-transparent"
                                  }`}
                                >
                                  {reportedStudent.isBlocked
                                    ? "🔓 Reinstate User"
                                    : "🔒 Block User Account"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-yellow-500 font-semibold italic">
                              ⚠️ Warning: Could not find any registered user matching the roll number prefix in the directory.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
