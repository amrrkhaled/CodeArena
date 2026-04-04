import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../style/adminShowAllSubmission.css';
import api from "../api";

export const AdminShowSubmissonById = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissionById = async () => {
      try {
        const response = await api.get(
          `/submissions/public/${id}`
        );
        setSubmission(response.data);
      } catch (error) {
        console.error('Error fetching submission:', error.response?.data || error.message);
        setError('Failed to fetch submission. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionById();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="submission-details-container" style={{ background: '#eeeeee', minHeight: '100vh', padding: '2rem' }}>
      <div className="submission-card-large">
        <h1 className="submission-title">Submission #{id}</h1>

        {submission ? (
          <>
            <div className="submission-meta">
              <p><strong>Problem ID:</strong> {submission.problem_id}</p>
              <p><strong>Title:</strong> {submission.title}</p>
              <p>
                <strong>Verdict:</strong>{' '}
                <span
                  className={
                    submission.verdict === 'Accepted'
                      ? 'verdict-accepted'
                      : 'verdict-rejected'
                  }
                >
                  {submission.verdict}
                </span>
              </p>
              <p><strong>Execution Time:</strong> {submission.execution_time_ms} ms</p>
              <p><strong>Submitted At:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
            </div>

            <div className="submission-code-section">
              <h2>Submitted Code</h2>
              <pre className="code-block-large">{submission.code}</pre>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: '#787A91' }}>
            No submission found with ID {id}.
          </p>
        )}

        <div className="back-button">
          <button onClick={() => window.history.back()}>⬅ Back</button>
        </div>
      </div>
    </div>
  );
};
