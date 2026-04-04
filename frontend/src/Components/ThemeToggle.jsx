import { useContext } from "react";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { ThemeContext } from "../context/ContextCreation";
import "../style/ThemeToggle.css";

const ThemeToggle = ({ className = "", compact = false }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const nextMode = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-button ${compact ? "compact" : ""} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
      </span>
      {!compact && <span className="theme-toggle-text">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
};

export default ThemeToggle;
