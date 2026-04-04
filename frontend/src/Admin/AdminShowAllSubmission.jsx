import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import '../style/adminShowAllSubmission.css';
import api from "../api";
import { ContestContext } from "../context/ContextCreation";

export const AdminShowAllSubmission = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const submissionsPerPage = 6; 
  const navigate = useNavigate();
  const { selectedContestId } = useContext(ContestContext);
  const contestId = selectedContestId;

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!contestId) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('adminToken'); 
        if (!token) {
          console.error("No admin token found. Please log in first.");
          return;
        }

        const response = await api.get(
          `/submissions?contest_id=${contestId}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSubmissions(response.data);
      } catch (error) {
        console.error('Error fetching submissions:', error.response?.data || error.message);
        setError("Failed to fetch submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [contestId]);

  if (loading) return <div>Loading submissions...</div>;
  if (error) return <div className="error-message">{error}</div>;

  // Pagination logic
  const indexOfLast = currentPage * submissionsPerPage;
  const indexOfFirst = indexOfLast - submissionsPerPage;
  const currentSubmissions = submissions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(submissions.length / submissionsPerPage);

  return (
    <div className="admin-submissions-container">
      <div className="admin-submissions-header">
        <h1>All Submissions</h1>
        <p>{contestId ? `Contest ID: ${contestId}` : "Select a contest"}</p>
      </div>

      {submissions.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#787A91' }}>
          No submissions available yet.
        </p>
      ) : (
        <>
          <div className="cards-grid">
            {currentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="submission-card"
                onClick={() => navigate(`/admin/submissions/${submission.id}`)}
              >
                <h3>#{submission.id} – {submission.problem_id}</h3>
                <p className="card-title">{submission.title}</p>
                <p className="card-team">
                  Team: <strong>{submission.team_name}</strong>
                </p>
                <p
                  className={
                    submission.verdict === 'Accepted'
                      ? 'verdict-accepted'
                      : 'verdict-rejected'
                  }
                >
                  {submission.verdict}
                </p>
                <p className="card-time">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};
