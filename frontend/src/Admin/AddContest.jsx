import React, { useContext, useState } from 'react';
import '../style/AddContest.css';
import api from "../api";
import { ContestContext } from "../context/ContextCreation";

export const AddContest = () => {
  const { refreshContests, setSelectedContestId } = useContext(ContestContext);
  const [name, setName] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [createdContest, setCreatedContest] = useState(null);

  const handleAddContest = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedContest(null);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await api.post(
        '/contests/',
        { name, start_time, end_time },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (response.status === 201) {
        const nextContest = response.data;
        setCreatedContest(nextContest);
        await refreshContests(nextContest.id);
        setSelectedContestId(String(nextContest.id));
        setName('');
        setStartTime('');
        setEndTime('');
      } else {
        setError('Failed to create contest');
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create contest');
      }
    }
  };

  return (
    <div className="add-contest-container">
      <div className="add-contest-card">
        <form onSubmit={handleAddContest}>
          <div className="input-group">
            <label htmlFor="name">Contest Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="start_time">Start Time</label>
            <input
              type="datetime-local"
              id="start_time"
              value={start_time}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="end_time">End Time</label>
            <input
              type="datetime-local"
              id="end_time"
              value={end_time}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}
          {createdContest && (
            <div className="contest-created-banner">
              <div className="contest-created-copy">
                <span className="contest-created-kicker">Ready</span>
                <strong>{createdContest.name}</strong>
                <p>Created and selected.</p>
              </div>
              <span className="contest-created-id">ID {createdContest.id}</span>
            </div>
          )}

          <button type="submit">Add Contest</button>
        </form>
      </div>
    </div>
  );
};
