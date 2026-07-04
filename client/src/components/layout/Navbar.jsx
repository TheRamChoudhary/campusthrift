import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import api from "../../api/axiosInstance";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Notifications Dropdown state
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);


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
    <nav className={`bg-black/50 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-6">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-extrabold text-white flex items-center gap-2 hover:opacity-90 transition flex-shrink-0"
          >
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <span className="tracking-tight hidden sm:block">CampusThrift</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 ml-8">
            <Link
              to="/marketplace"
              className="text-[15px] font-semibold text-white/70 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Marketplace
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-listings"
                className="text-[15px] font-semibold text-white/70 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/10"
              >
                My Listings
              </Link>
            )}
            
            {isAuthenticated && (
              <Link
                to="/chat"
                className="text-[15px] font-semibold text-white/70 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/10"
              >
                Chats
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/feedback"
                className="text-[15px] font-semibold text-white/70 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/10"
              >
                Feedback
              </Link>
            )}
            {isAuthenticated &&
              ["admin", "moderator"].includes(user?.role || profile?.role) && (
                <Link
                  to="/admin"
                  className="text-[15px] font-bold text-white bg-white/10 hover:bg-white/20 transition px-3 py-2 rounded-xl"
                >
                  Admin
                </Link>
              )}
          </div>
        </div>

        {/* Right Side: Sell, Notifications, Profile, Mobile Toggle */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          <Link
            to="/create-listing"
            className="hidden sm:block bg-[#1DB954] hover:bg-[#1ed760] text-black text-[14px] font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            + Sell Item
          </Link>

          {/* Notifications Bell (Desktop) */}
          {isAuthenticated && (
            <div className="relative ml-1">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex items-center justify-center animate-fadeIn"
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[10px] font-black w-4 h-4 flex items-center justify-center border border-[#121212] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-3 z-50 text-white animate-scaleUp">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#333333]">
                    <span className="font-extrabold text-xs text-white">
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

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#333333]">
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
                          className={`p-3 hover:bg-white/5 transition cursor-pointer flex gap-3 items-start ${notif.isRead ? "" : "bg-white/5"}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1DB954] mt-1 flex-shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-white truncate">
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-white/40 font-mono mt-1">
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
          <div className="hidden lg:flex items-center border-l border-[#333333] pl-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard?tab=profile" className="flex items-center gap-3 group transition" title="Profile Settings">
                  {profile?.avatar || user?.avatar ? (
                    <img
                      src={profile?.avatar || user?.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-[#333333] group-hover:border-[#1DB954] transition flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#181818] flex items-center justify-center text-white font-bold text-sm uppercase group-hover:border-[#1DB954] transition border border-[#333333] flex-shrink-0">
                      {user?.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="text-left hidden xl:block leading-tight">
                    <p className="text-[14px] font-bold text-white group-hover:text-[#1DB954] transition truncate max-w-[120px]">
                      {(user?.name || "User").split(" ")[0]}
                    </p>
                    <p className="text-[14px] font-bold text-white group-hover:text-[#1DB954] transition truncate max-w-[120px]">
                      {(user?.name || "User").split(" ").slice(1).join(" ")}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[14px] text-white/70 hover:text-rose-500 font-semibold transition ml-2 px-3 py-2 rounded-xl hover:bg-white/10"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[15px] font-semibold text-white/70 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" className="bg-[#1DB954] text-black hover:bg-[#1ed760] text-[15px] font-bold px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile controls & toggle button */}
          <div className="flex items-center gap-2 lg:hidden">
          {/* Notifications (Mobile) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsMenuOpen(false);
                }}
                className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-[-60px] mt-3 w-72 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-3 z-50 text-white animate-scaleUp">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#333333]">
                    <span className="font-extrabold text-xs text-white">
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

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#333333]">
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
                          className={`p-3 hover:bg-white/5 transition cursor-pointer flex gap-3 items-start ${!notif.isRead ? "bg-white/5" : ""}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1DB954] mt-1 flex-shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-white truncate">
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-white/40 font-mono mt-1">
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
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex items-center justify-center font-sans font-bold"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        </div>
      </div>

      {/* Mobile Drawer menu overlay */}
      {isMenuOpen && (
        <div className="lg:hidden bg-black/80 backdrop-blur-2xl border-b border-white/10 px-4 py-4 space-y-3 animate-slideDown backdrop-blur-lg">
          <Link
            to="/marketplace"
            onClick={() => setIsMenuOpen(false)}
            className="block text-sm font-medium text-white/70 hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
          >
            Marketplace
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard?tab=profile"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-white/70 hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
            >
              👤 Profile Settings
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/my-listings"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-white/70 hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
            >
              My Listings
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/chat"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-white/70 hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
            >
              💬 Chats
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/feedback"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-white/70 hover:text-white transition py-2.5 px-3 rounded-lg hover:bg-white/5"
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
              className="block bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2.5 rounded-full text-center transition-all hover:scale-[1.02]"
            >
              + Sell Item
            </Link>

            {/* Profile & Logout section */}
            <div className="pt-3 border-t border-[#333333] flex items-center justify-between px-3">
            <Link
              to="/dashboard?tab=profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2.5 hover:opacity-85 transition"
            >
              {profile?.avatar || user?.avatar ? (
                <img
                  src={profile?.avatar || user?.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[#30363d]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {user?.name?.[0] || "?"}
                </div>
              )}
              <span className="text-sm font-bold text-[#c9d1d9] truncate max-w-[120px]">
                {user?.name || "User"}
              </span>
            </Link>
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
