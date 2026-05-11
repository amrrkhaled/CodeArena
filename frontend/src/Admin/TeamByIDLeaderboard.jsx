import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/TeamByIDLeaderboard.css";
import api from "../api";

export const TeamByIDLeaderboard = () => {
  const [teamData, setTeamData] = useState({
    team_id: null,
    team_name: "",
    solved_count: 0,
    total_submissions: 0,
    wrong_submissions: 0,
    solved_problems: [],
    attempted_problems: [],
    submissions: [],
    total_penalty: 0,
  });

  const { contestId, teamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await api.get(
          `/leaderboard/admin/${contestId}/${teamId}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        setTeamData({
          ...response.data,
          solved_problems: response.data.solved_problems ?? [],
          attempted_problems: response.data.attempted_problems ?? [],
          submissions: response.data.submissions ?? [],
        });
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };

    fetchTeamData();
  }, [contestId, teamId]);

  return (
    <div className="team-leaderboard-container">
      <div className="team-content">
        <div className="team-header">
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", marginBottom: "0.5rem", color: "#4682A9" }}>← Back</button>
          <h2>{teamData.team_name}</h2>
          <p>Team Performance Overview</p>
        </div>

        {/* Stats cards */}
        <div className="team-stats">
          <div className="stat-card">
            <span>Solved Problems</span>
            <h3>{teamData.solved_count}</h3>
          </div>
          <div className="stat-card">
            <span>Total Submissions</span>
            <h3>{teamData.total_submissions}</h3>
          </div>
          <div className="stat-card">
            <span>Wrong Submissions</span>
            <h3>{teamData.wrong_submissions}</h3>
          </div>
          <div className="stat-card">
            <span>Total Penalty</span>
            <h3>{teamData.total_penalty} mins</h3>
          </div>
        </div>

        {/* Solved Problems */}
        <div className="team-section">
          <h3>Solved Problems</h3>
          <ul>
            {teamData.solved_problems.map((problem, index) => (
              <li key={index}>
                <strong>{problem.title || problem.problem_id}</strong>
                {problem.accepted_at && (
                  <span className="accepted-tag">
                    Accepted at {new Date(problem.accepted_at).toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Attempted Problems */}
        <div className="team-section">
          <h3>Attempted (Unsolved) Problems</h3>
          <ul>
            {teamData.attempted_problems.map((problem, index) => (
              <li key={index}>{problem.title || problem.problem_id}</li>
            ))}
          </ul>
        </div>

        {/* Submissions */}
        <div className="team-section">
          <h3>Submissions</h3>
          <table className="team-submissions-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Verdict</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {teamData.submissions.map((submission, idx) => (
                <tr
                  key={submission.id || idx}
                  className={
                    submission.verdict === "Accepted"
                      ? "row-success"
                      : "row-danger"
                  }
                >
                  <td>{submission.problem_id || "N/A"}</td>
                  <td>{submission.verdict || "N/A"}</td>
                  <td>
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
