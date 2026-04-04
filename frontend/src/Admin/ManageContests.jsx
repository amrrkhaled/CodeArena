import React, { useContext, useMemo, useState } from "react";
import api from "../api";
import { ContestContext } from "../context/ContextCreation";
import "../style/ManageContests.css";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export const ManageContests = () => {
  const { contests, refreshContests, selectedContestId, setSelectedContestId } = useContext(ContestContext);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    start_time: "",
    end_time: "",
    is_active: false,
    blind_started_at: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);

  const sortedContests = useMemo(
    () => [...contests].sort((a, b) => Number(b.is_active) - Number(a.is_active) || b.id - a.id),
    [contests]
  );

  const beginEdit = (contest) => {
    setEditingId(contest.id);
    setDraft({
      name: contest.name || "",
      start_time: toDateTimeLocal(contest.start_time),
      end_time: toDateTimeLocal(contest.end_time),
      is_active: Boolean(contest.is_active),
      blind_started_at: contest.blind_started_at || null,
    });
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const saveContest = async (contestId, nextValues) => {
    setBusyId(contestId);
    setError("");
    setSuccess("");
    try {
      const adminToken = localStorage.getItem("adminToken");
      const response = await api.put(`/contests/${contestId}`, nextValues, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      await refreshContests(response.data.id);
      setSelectedContestId(String(response.data.id));
      setSuccess(`Saved changes for ${response.data.name}.`);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save contest changes.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleContest = async (contest) => {
    await saveContest(contest.id, {
      name: contest.name,
      start_time: toDateTimeLocal(contest.start_time),
      end_time: toDateTimeLocal(contest.end_time),
      is_active: !contest.is_active,
      blind_started_at: contest.blind_started_at || null,
    });
  };

  const toggleBlindTime = async (contest) => {
    await saveContest(contest.id, {
      name: contest.name,
      start_time: toDateTimeLocal(contest.start_time),
      end_time: toDateTimeLocal(contest.end_time),
      is_active: Boolean(contest.is_active),
      blind_started_at: contest.blind_started_at ? null : new Date().toISOString(),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    await saveContest(editingId, draft);
  };

  return (
    <div className="manage-contests">
      {(error || success) && (
        <div className={`manage-contests-alert ${error ? "error" : "success"}`}>
          {error || success}
        </div>
      )}

      <div className="manage-contests-list">
        {sortedContests.length === 0 ? (
          <div className="manage-contests-empty">Create your first contest to manage it here.</div>
        ) : (
          sortedContests.map((contest) => {
            const isEditing = editingId === contest.id;
            const isBusy = busyId === contest.id;

            return (
              <article className="contest-manage-card" key={contest.id}>
                <div className="contest-manage-top">
                  <div>
                    <div className="contest-manage-title-row">
                      <h3>{contest.name || `Contest #${contest.id}`}</h3>
                      <span className={`contest-manage-status ${contest.is_active ? "live" : "draft"}`}>
                        {contest.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className={`contest-manage-status ${contest.blind_started_at ? "blind" : "draft"}`}>
                        {contest.blind_started_at ? "Blind Time On" : "Blind Time Off"}
                      </span>
                    </div>
                    <p>
                      {new Date(contest.start_time).toLocaleString()} to{" "}
                      {new Date(contest.end_time).toLocaleString()}
                    </p>
                    {contest.blind_started_at && (
                      <p className="contest-manage-blind-note">
                        Blind time started at {new Date(contest.blind_started_at).toLocaleString()}.
                      </p>
                    )}
                  </div>
                  <div className="contest-manage-actions">
                    <button
                      type="button"
                      className="contest-manage-secondary"
                      onClick={() => setSelectedContestId(String(contest.id))}
                    >
                      {String(selectedContestId) === String(contest.id) ? "Selected" : "Select"}
                    </button>
                    <button
                      type="button"
                      className="contest-manage-secondary"
                      onClick={() => beginEdit(contest)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`contest-manage-toggle ${contest.is_active ? "deactivate" : "activate"}`}
                      onClick={() => toggleContest(contest)}
                      disabled={isBusy}
                    >
                      {contest.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className={`contest-manage-toggle ${contest.blind_started_at ? "blind-off" : "blind-on"}`}
                      onClick={() => toggleBlindTime(contest)}
                      disabled={isBusy}
                    >
                      {contest.blind_started_at ? "End Blind Time" : "Start Blind Time"}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <form className="contest-edit-form" onSubmit={handleSubmit}>
                    <div className="contest-edit-grid">
                      <label>
                        <span>Name</span>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        <span>Start Time</span>
                        <input
                          type="datetime-local"
                          value={draft.start_time}
                          onChange={(e) => setDraft((current) => ({ ...current, start_time: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        <span>End Time</span>
                        <input
                          type="datetime-local"
                          value={draft.end_time}
                          onChange={(e) => setDraft((current) => ({ ...current, end_time: e.target.value }))}
                          required
                        />
                      </label>
                      <label className="contest-edit-check">
                        <span>Active</span>
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          onChange={(e) => setDraft((current) => ({ ...current, is_active: e.target.checked }))}
                        />
                      </label>
                    </div>
                    <div className="contest-edit-actions">
                      <button type="submit" className="contest-manage-primary" disabled={isBusy}>
                        Save Changes
                      </button>
                      <button type="button" className="contest-manage-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
