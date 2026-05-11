import React, { useContext, useMemo, useState } from "react";
import api from "../api";
import { ContestContext } from "../context/ContextCreation";
import "../style/ManageContests.css";

const STATUS_LABEL = {
  DRAFT:    "Draft",
  UPCOMING: "Upcoming",
  ACTIVE:   "Active",
  FROZEN:   "Frozen",
  FINISHED: "Finished",
};

const STATUS_CLASS = {
  DRAFT:    "draft",
  UPCOMING: "upcoming",
  ACTIVE:   "live",
  FROZEN:   "blind",
  FINISHED: "draft",
};

const STATUS_ORDER = { ACTIVE: 5, FROZEN: 4, UPCOMING: 3, FINISHED: 2, DRAFT: 1 };

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
  const [draft, setDraft] = useState({ name: "", start_time: "", end_time: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);

  const sortedContests = useMemo(
    () => [...contests].sort((a, b) => (STATUS_ORDER[b.status] ?? 0) - (STATUS_ORDER[a.status] ?? 0) || b.id - a.id),
    [contests]
  );

  const beginEdit = (contest) => {
    setEditingId(contest.id);
    setDraft({
      name: contest.name || "",
      start_time: toDateTimeLocal(contest.start_time),
      end_time: toDateTimeLocal(contest.end_time),
    });
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => { setEditingId(null); setError(""); };

  const adminHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  const callEndpoint = async (contestId, method, path, body = null) => {
    setBusyId(contestId);
    setError("");
    setSuccess("");
    try {
      const config = { headers: adminHeaders() };
      const response = body
        ? await api[method](path, body, config)
        : await api[method](path, null, config);
      await refreshContests(response.data.id);
      setSelectedContestId(String(response.data.id));
      setSuccess(`Updated: ${response.data.name}.`);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    await callEndpoint(editingId, "put", `/contests/${editingId}`, draft);
  };

  const publish   = (id) => callEndpoint(id, "post", `/contests/${id}/publish`);
  const unpublish = (id) => callEndpoint(id, "post", `/contests/${id}/unpublish`);
  const freeze    = (id) => callEndpoint(id, "post", `/contests/${id}/freeze`);
  const finish    = (id) => callEndpoint(id, "post", `/contests/${id}/finish`);

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
            const s = contest.status;

            return (
              <article className="contest-manage-card" key={contest.id}>
                <div className="contest-manage-top">
                  <div>
                    <div className="contest-manage-title-row">
                      <h3>{contest.name || `Contest #${contest.id}`}</h3>
                      <span className={`contest-manage-status ${STATUS_CLASS[s] ?? "draft"}`}>
                        {STATUS_LABEL[s] ?? s}
                      </span>
                      {s === "FROZEN" && (
                        <span className="contest-manage-status blind">Blind Time On</span>
                      )}
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
                      disabled={isBusy}
                    >
                      Edit
                    </button>

                    {s === "DRAFT" && (
                      <button type="button" className="contest-manage-toggle activate" onClick={() => publish(contest.id)} disabled={isBusy}>
                        Publish
                      </button>
                    )}
                    {s === "UPCOMING" && (
                      <button type="button" className="contest-manage-toggle deactivate" onClick={() => unpublish(contest.id)} disabled={isBusy}>
                        Unpublish
                      </button>
                    )}
                    {s === "ACTIVE" && (<>
                      <button type="button" className="contest-manage-toggle blind-on" onClick={() => freeze(contest.id)} disabled={isBusy}>
                        Start Blind Time
                      </button>
                      <button type="button" className="contest-manage-toggle deactivate" onClick={() => finish(contest.id)} disabled={isBusy}>
                        Finish
                      </button>
                    </>)}
                    {s === "FROZEN" && (
                      <button type="button" className="contest-manage-toggle deactivate" onClick={() => finish(contest.id)} disabled={isBusy}>
                        Finish
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <form className="contest-edit-form" onSubmit={saveEdit}>
                    <div className="contest-edit-grid">
                      <label>
                        <span>Name</span>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        <span>Start Time</span>
                        <input
                          type="datetime-local"
                          value={draft.start_time}
                          onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
                          required
                        />
                      </label>
                      <label>
                        <span>End Time</span>
                        <input
                          type="datetime-local"
                          value={draft.end_time}
                          onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))}
                          required
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
