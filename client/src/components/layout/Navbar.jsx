import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import api from "../../api/axiosInstance";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();



  // Notifications Dropdown state
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/5 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(255,255,255,0.1)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-white flex items-center gap-2 flex-shrink-0"
        >
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <span>CampusThrift</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-[#8b949e] hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Dashboard
          </Link>
          <Link
            to="/my-listings"
            className="text-sm font-medium text-[#8b949e] hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
          >
            My Listings
          </Link>
          {isAuthenticated && (
            <Link
              to="/chat"
              className="text-sm font-medium text-[#8b949e] hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
            >
              💬 Chats
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/feedback"
              className="text-sm font-medium text-[#8b949e] hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
            >
              📣 Feedback
            </Link>
          )}
          {isAuthenticated &&
            ["admin", "moderator"].includes(user?.role || profile?.role) && (
              <Link
                to="/admin"
                className="text-sm font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:text-white transition px-3 py-2 rounded-lg"
              >
                🛡️ Admin
              </Link>
            )}
          <Link
            to="/create-listing"
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Sell Item
          </Link>

          {/* Notifications Bell (Desktop) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-white/10 transition flex items-center justify-center animate-fadeIn"
                title="Notifications"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#161b22]/95 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-2xl py-3 z-50 text-[#c9d1d9] animate-scaleUp">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#30363d]">
                    <span className="font-extrabold text-xs text-[#c9d1d9]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-[10px] font-bold text-gray-455 hover:text-white transition text-gray-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#30363d]">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) {
                              markReadMutation.mutate(notif._id);
                            }
                            setIsNotifDropdownOpen(false);
                            if (notif.link) {
                              navigate(notif.link);
                            }
                          }}
                          className={`p-3 hover:bg-[#30363d]/50 transition cursor-pointer flex gap-3 items-start ${!notif.isRead ? "bg-white/5" : ""}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#238636] mt-1 flex-shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-[#c9d1d9] truncate">
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-[#8b949e] leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-gray-400 font-mono mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <span className="text-3xl block mb-2 opacity-50">
                          📭
                        </span>
                        <p className="text-xs text-gray-400 font-semibold">
                          All caught up!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Logout (Desktop) */}
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm uppercase">
              {user?.name?.[0] || "?"}
            </div>
            <span className="text-sm text-[#8b949e] hidden lg:block max-w-[100px] truncate">
              {user?.name || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-[#8b949e] hover:text-red-500 transition ml-1 px-2 py-1 rounded hover:bg-white/10"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile controls & toggle button */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Notifications (Mobile) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsMenuOpen(false);
                }}
                className="relative p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-white/10 transition flex items-center justify-center"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-[-60px] mt-3 w-72 bg-[#161b22]/95 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-2xl py-3 z-50 text-[#c9d1d9] animate-scaleUp">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#30363d]">
                    <span className="font-extrabold text-xs text-[#c9d1d9]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-[10px] font-bold text-gray-455 hover:text-white transition text-gray-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#30363d]">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) {
                              markReadMutation.mutate(notif._id);
                            }
                            setIsNotifDropdownOpen(false);
                            if (notif.link) {
                              navigate(notif.link);
                            }
                          }}
                          className={`p-3 hover:bg-[#30363d]/50 transition cursor-pointer flex gap-3 items-start ${!notif.isRead ? "bg-white/5" : ""}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#238636] mt-1 flex-shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-[#c9d1d9] truncate">
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-[#8b949e] leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-gray-400 font-mono mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <span className="text-3xl block mb-2 opacity-50">
                          📭
                        </span>
                        <p className="text-xs text-gray-400 font-semibold">
                          All caught up!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger Toggle */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsNotifDropdownOpen(false);
            }}
            className="p-2 rounded-xl text-[#8b949e] hover:text-white hover:bg-white/10 transition flex items-center justify-center font-sans font-bold"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0d1117]/95 border-b border-[#30363d] px-4 py-4 space-y-3 animate-slideDown backdrop-blur-lg">
          <Link
            to="/dashboard"
            onClick={() => setIsMenuOpen(false)}
            className="block text-sm font-medium text-[#8b949e] hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
          >
            Dashboard
          </Link>
          <Link
            to="/my-listings"
            onClick={() => setIsMenuOpen(false)}
            className="block text-sm font-medium text-[#8b949e] hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
          >
            My Listings
          </Link>
          {isAuthenticated && (
            <Link
              to="/chat"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-[#8b949e] hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
            >
              💬 Chats
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/feedback"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-[#8b949e] hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
            >
              📣 Feedback
            </Link>
          )}
          {isAuthenticated &&
            ["admin", "moderator"].includes(user?.role || profile?.role) && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-semibold text-white bg-white/5 border border-white/20 hover:bg-white/10 transition py-2.5 px-3 rounded-lg text-center"
              >
                🛡️ Admin Control Panel
              </Link>
            )}
          <Link
            to="/create-listing"
            onClick={() => setIsMenuOpen(false)}
            className="block bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium py-2.5 rounded-lg text-center transition"
          >
            + Sell Item
          </Link>

          {/* Profile & Logout section */}
          <div className="pt-3 border-t border-[#30363d] flex items-center justify-between px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm uppercase">
                {user?.name?.[0] || "?"}
              </div>
              <span className="text-sm font-bold text-[#c9d1d9] truncate max-w-[120px]">
                {user?.name || "User"}
              </span>
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="text-sm text-rose-500 hover:text-rose-400 font-bold transition py-1 px-3 rounded hover:bg-rose-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
