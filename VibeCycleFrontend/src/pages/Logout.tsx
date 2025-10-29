import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

const Logout = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear token from context and localStorage via AuthProvider
    setToken(null);
    // Redirect to login page after clearing auth
    navigate("/login", { replace: true });
  }, [setToken, navigate]);

  return <div>Logging out…</div>;
};

export default Logout;
