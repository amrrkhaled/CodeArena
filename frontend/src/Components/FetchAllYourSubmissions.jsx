import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import '../style/FetchSubmissions.css';
import api from "../api";
import { ContestContext } from "../context/ContextCreation";

export const FetchAllYourSubmissions = () => {
  const [row, setRow] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 
  const { selectedContestId } = useContext(ContestContext);
  const contestId = selectedContestId;

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      if (!contestId) {
        setRow([]);
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/submissions/mine', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params:{
            contest_id : contestId
          }
        });
        setRow(response.data);
        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to fetch submissions:', err);
        setLoading(false);
        if (err.response && err.response.status === 401) {
          setError('❌ Unauthorized. Please log in again.');
        } else {
          setError('❌ Could not load submissions. Try again later.');
          setRow([]);
        }
      }
    };

    fetchSubmissions();
  }, [contestId]);

  const handleRowClick = (submissionId) => {
    navigate(`/submissions/${submissionId}`); // route to detail view
  };

  return (
    <div className="team-submissions-container">
      <div className="submissions-header-bar">
        <div>
          <h2>Your Submissions</h2>
          <p>Review every attempt for the active contest in one place.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Loading submissions...</div>}

      {row.length > 0 && !loading && (
        <div className="submission-overview-grid">
          <div className="submission-overview-card">
            <span>Total Attempts</span>
            <strong>{row.length}</strong>
          </div>
          <div className="submission-overview-card">
            <span>Accepted</span>
            <strong>{row.filter((submission) => submission.verdict === "Accepted").length}</strong>
          </div>
          <div className="submission-overview-card">
            <span>Latest Activity</span>
            <strong>{new Date(row[0].submitted_at).toLocaleDateString()}</strong>
          </div>
        </div>
      )}

      {!loading && row.length === 0 ? (
        <div className="alert alert-info">No submissions found yet for this contest.</div>
      ) : (
        <div className="submission-list">
          {row.map((submission) => (
            <button
              key={submission.id}
              className="submission-list-item"
              onClick={() => handleRowClick(submission.id)}
              type="button"
            >
              <div className="submission-list-top">
                <div>
                  <span className="submission-label">Submission #{submission.id}</span>
                  <h3>{submission.title}</h3>
                </div>
                <span className={`submission-verdict ${submission.verdict === "Accepted" ? "accepted" : "rejected"}`}>
                  {submission.verdict}
                </span>
              </div>
              <div className="submission-list-meta">
                <span>Problem {submission.problem_id}</span>
                <span>{new Date(submission.submitted_at).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
