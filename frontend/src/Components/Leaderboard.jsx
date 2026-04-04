import React, { useState, useEffect, useContext } from 'react';
import '../style/Leaderboard.css'; 
import api from "../api";
import { useParams } from 'react-router-dom';
import { ContestContext } from "../context/ContextCreation";

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { contestId } = useParams();
  const { currentContest, blindTimeStarted } = useContext(ContestContext);

  useEffect(() => {
    if (!contestId) {
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }
    const fetchLeaderBoard = async () => {
      try {
        const response = await api.get(`/leaderboard/${contestId}`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderBoard();

    const interval = setInterval(fetchLeaderBoard, 10000);
    return () => clearInterval(interval);
  }, [contestId]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>
          {currentContest?.name
            ? `Current standings for ${currentContest.name}.`
            : "Track the current standings for the selected contest."}
        </p>
        {blindTimeStarted && String(currentContest?.id) === String(contestId) && (
          <div className="blind-time-banner">
            Blind time started. Standings are frozen for teams.
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          <h2>No standings yet</h2>
          <p>The leaderboard will appear once teams start submitting for this contest.</p>
        </div>
      ) : (
        <div className="leaderboard-shell">
          <div className="leaderboard-summary-card">
            <span className="leaderboard-summary-label">Teams Ranked</span>
            <strong>{leaderboard.length}</strong>
          </div>
          <div className="leaderboard-summary-card">
            <span className="leaderboard-summary-label">Top Solved</span>
            <strong>{leaderboard[0]?.solved_count ?? 0}</strong>
          </div>
          <div className="leaderboard-summary-card">
            <span className="leaderboard-summary-label">Best Time</span>
            <strong>{leaderboard[0]?.total_penalty ?? 0} min</strong>
          </div>

          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="table-head-cell">#</th>
                <th className="table-head-cell">Team Name</th>
                <th className="table-head-cell">Solved</th>
                <th className="table-head-cell">Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((team, index) => (
                <tr
                  key={team.team_id || `${team.team_name}-${index}`}
                  className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                >
                  <td className="table-cell table-rank-cell">{index + 1}</td>
                  <td className="table-cell table-team-cell">{team.team_name}</td>
                  <td className="table-cell">{team.solved_count}</td>
                  <td className="table-cell">{team.total_penalty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
