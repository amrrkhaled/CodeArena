import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/ContextCreation";

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear stored authentication
    localStorage.removeItem("token");

    logout();

    // Redirect to home
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return null; 
};

export default Logout;
