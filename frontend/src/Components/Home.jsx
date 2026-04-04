import "../style/Home.css";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/ContextCreation";

const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <section className="home-container">
      <div className="home-shell">
        <div className="hero-copy">
          <span className="hero-kicker">Built for focused competition</span>
          <h1>CodeArena turns every contest into a sharp, fast, modern experience.</h1>
          <p className="hero-lead">
            Launch programming contests, manage teams, upload problem sets, and track live
            rankings from one clean workspace.
          </p>
          <div className="hero-actions">
            <Link to={isLoggedIn ? "/problems" : "/login"} className="hero-button hero-button-primary">
              {isLoggedIn ? "Open Problems" : "Enter Arena"}
            </Link>
            <Link to="/about" className="hero-button hero-button-secondary">Explore Platform</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>Live</strong>
              <span>leaderboards</span>
            </div>
            <div className="hero-stat">
              <strong>Fast</strong>
              <span>submission flow</span>
            </div>
            <div className="hero-stat">
              <strong>Simple</strong>
              <span>admin controls</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-glow"></div>
          <div className="hero-panel-card">
            <p className="panel-label">Contest Snapshot</p>
            <h2>Run your arena with clarity.</h2>
            <ul className="panel-points">
              <li>Design contests with clean start and end scheduling.</li>
              <li>Upload structured JSON problem sets in minutes.</li>
              <li>Review submissions and standings without leaving the dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Home;
