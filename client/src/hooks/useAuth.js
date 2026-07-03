import useAuthStore from "../store/authStore";

const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  return { user, token, isAuthenticated, setAuth, logout };
};

export default useAuth;
