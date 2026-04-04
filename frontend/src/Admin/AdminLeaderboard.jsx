import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Leaderboard.css';
import api from "../api";
import { useContext } from 'react';
import { ContestContext } from "../context/ContextCreation";

export const AdminLeaderboard = () => {
  const { selectedContestId } = useContext(ContestContext);
  const contestId = selectedContestId;
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminLeaderboard = async () => {
      if (!contestId) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await api.get(`leaderboard/admin/${contestId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchAdminLeaderboard();

    // Refresh every 10 seconds
    const interval = setInterval(fetchAdminLeaderboard, 10000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [contestId]);

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <h1>Admin Leaderboard</h1>
        <p>{contestId ? `Contest ID: ${contestId}` : "Select a contest"}</p>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#787A91' }}>
          No entries in the leaderboard yet.
        </p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="table-head-cell">Rank</th>
              <th className="table-head-cell">Team Name</th>
              <th className="table-head-cell">Solved</th>
              <th className="table-head-cell">Total Submissions</th>
              <th className="table-head-cell">Wrong Submissions</th>
              <th className="table-head-cell">Penalty</th>
              <th className="table-head-cell">Avg Penalty / Solved</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.team_id}>
                <td className="table-cell">{index + 1}</td>
                <td className="table-cell">
                  <Link 
                    to={`/admin/leaderboard/${contestId}/team/${entry.team_id}`} 
                    className="team-link"
                    style={{ textDecoration: 'none', color: '#4682A9' }}
                  >
                    {entry.team_name}
                  </Link>
                </td>
                <td className="table-cell">{entry.solved_count}</td>
                <td className="table-cell">{entry.total_submissions}</td>
                <td className="table-cell">{entry.wrong_submissions}</td>
                <td className="table-cell">{entry.total_penalty}</td>
                <td className="table-cell">{entry.avg_penalty_per_solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
