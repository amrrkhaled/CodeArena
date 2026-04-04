import { Link, useLocation } from "react-router-dom";
import LoginIcon from "@mui/icons-material/Login";
import InfoIcon from "@mui/icons-material/Info";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt"; // Problems
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn"; // Submissions
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // Leaderboard
import LogoutIcon from "@mui/icons-material/Logout"; // Logout
import "../style/Navbar.css";
import { useContext } from "react";
import { AuthContext, ContestContext } from "../context/ContextCreation";
import ContestSelect from "./ContestSelect";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { contests, selectedContestId, setSelectedContestId } = useContext(ContestContext);
  const location = useLocation();
  const path = location.pathname;
  const isAdminRoute = path.startsWith("/admin");

  const isHomePage = path === "/";
  const isAboutPage = path === "/About";

  if (isAdminRoute) {
    return null;
  }

  return (
    <div className="navbar-wrapper">
      <div className="nav-content">
        <div className="nav-left">
          <Link to="/" className="brand-link">
            <span className="brand-mark">CodeArena</span>
          </Link>
        </div>

        <div className="nav-title">
          <Link to="/" className="title-link">
            <span className="title-text">CodeArena</span>
          </Link>
        </div>

        {isLoggedIn && (
          <ContestSelect
            id="contest-picker"
            className="nav-contest-picker"
            label=""
            options={contests}
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
            placeholder="Choose contest"
            emptyLabel="No contests"
          />
        )}

        <div className="nav-links">
          <ThemeToggle compact className="nav-theme-toggle" />
          {isLoggedIn ? (
            <>
              <Link to="/" className="nav-link" title="Home">
                <HomeIcon className="nav-icon" />
              </Link>
              <Link to="/problems" className="nav-link" title="Problems">
                <ListAltIcon className="nav-icon" />
              </Link>
              <Link to="/submissions" className="nav-link" title="Submissions">
                <AssignmentTurnedInIcon className="nav-icon" />
              </Link>
              <Link
                to={selectedContestId ? `/leaderboard/${selectedContestId}` : "/"}
                className="nav-link"
                title="Leaderboard"
              >
                <EmojiEventsIcon className="nav-icon" />
              </Link>
              <Link to="/logout" className="nav-link" title="Logout">
                <LogoutIcon className="nav-icon" />
              </Link>
            </>
          ) : (
            <>
              {!isAboutPage && (
                <Link to="/About" className="nav-link" title="About">
                  <InfoIcon className="nav-icon" />
                </Link>
              )}
              {!isHomePage && (
                <Link to="/" className="nav-link" title="Home">
                  <HomeIcon className="nav-icon" />
                </Link>
              )}
              {(isHomePage || isAboutPage) && (
                <Link to="/Login" className="nav-link" title="Login">
                  <LoginIcon className="nav-icon" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
