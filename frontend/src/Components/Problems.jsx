import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ContestContext } from "../context/ContextCreation";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Pagination, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import "../style/Problems.css";

const Problems = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [problems, setProblems] = useState([]);
  const problemsPerPage = 6;
  const [solvedProblems, setSolvedProblems] = useState(0);
  const { timeLeft, status, selectedContestId, blindTimeStarted, currentContest } = useContext(ContestContext);
  const contestId = selectedContestId;


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!contestId) {
      setProblems([]);
      setSolvedProblems(0);
      return;
    }
    if (status === "running") {
      api.get(`/problems/${contestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setProblems(res.data))
      .catch(err => {
        console.error("API error:", err);
        if (err.response?.status === 401) navigate('/login');
      });

      api.get('/submissions/solved-count', {
        headers: { Authorization: `Bearer ${token}` },
        params: { contest_id: contestId }
      })
      .then(res => {
        setSolvedProblems(res.data.solvedCount);
      })
      .catch(err => console.error("Error fetching solved problems:", err));
    } else {
      setProblems([]);
      setSolvedProblems(0);
    }
  }, [status, contestId, navigate]);

  const handleChange = (_, value) => setPage(value);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const displayedProblems = problems.slice((page - 1) * problemsPerPage, page * problemsPerPage);
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : "No Contest";

  return (
    <div className="problems-page">
      <div className="problems-hero">
        <div className="problems-hero-copy">
          <h1>Problems</h1>
          <p>
            {currentContest?.name
              ? `Browse the active set for ${currentContest.name} and jump straight into solving.`
              : "Select a contest to browse its problem set and start solving."}
          </p>
        </div>
        <div className={`problems-status-pill${status === "inactive" ? " inactive" : ""}`}>{statusLabel}</div>
      </div>
      {!contestId && (
        <div className="problems-empty-state">Select a contest first to view problems.</div>
      )}
      {contestId && status === "inactive" && (
        <div className="problems-empty-state">This contest is currently inactive.</div>
      )}
      {blindTimeStarted && (
        <div className="problems-blind-banner">Blind time has started. The public leaderboard is now frozen.</div>
      )}
      {status === "running" && <div className="problems-shell">
        <div className="problems-card">
          <div className="problems-card-header">
            <h2>Problem List</h2>
          </div>
          <div className="problems-table-wrap">
            <TableContainer component={Paper} style={{ boxShadow: "none", background: "transparent", border: "0", borderRadius: 0 }}>
              <Table>
                <TableHead>
                  <TableRow style={{ background: "var(--surface-hover)" }}>
                    <TableCell style={{ color: "var(--text-strong)", fontWeight: "bold", fontSize: "1.02rem", textAlign: "center", width: "14%"}}>ID</TableCell>
                    <TableCell style={{ color: "var(--text-strong)", fontWeight: "bold", fontSize: "1.02rem", textAlign: "center" }}>Title</TableCell>
                    <TableCell style={{ color: "var(--text-strong)", fontWeight: "bold", fontSize: "1.02rem", textAlign: "center", width: "18%" }}>Contest</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedProblems.map((p) => (
                    <TableRow
                      key={p.id}
                      component={RouterLink}
                      to={`/problems/${p.id}`}
                      sx={{ backgroundColor: "transparent", cursor: "pointer", textDecoration: "none", "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-cool) 10%, transparent)" } }}
                    >
                      <TableCell style={{ textAlign: "center", color: "var(--text)", borderBottom: "1px solid var(--border-soft)" }} >{p.id}</TableCell>
                      <TableCell style={{ textAlign: "center", color: "var(--text)", borderBottom: "1px solid var(--border-soft)" }} >{p.title}</TableCell>
                      <TableCell style={{ textAlign: "center", color: "var(--text)", borderBottom: "1px solid var(--border-soft)" }} >{p.contest_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {problems.length > problemsPerPage && (
            <Box className="problems-pagination">
              <Pagination count={Math.ceil(problems.length / problemsPerPage)} page={page} onChange={handleChange} color="primary" />
            </Box>
          )}
        </div>

        <div className="problems-sidebar">
          <div className="problems-sidebar-card">
            <h3>Contest Clock</h3>
            <p>
              {status === "upcoming" && "Contest starts in"}
              {status === "running" && "Time remaining"}
              {status === "ended" && "Contest has ended"}
            </p>
            {status !== "ended" && <div className="problems-sidebar-value">{formatTime(timeLeft)}</div>}
          </div>

          <div className="problems-sidebar-card">
            <h3>Progress</h3>
            <p>Track your solved count for the currently selected contest.</p>
            <div className="problems-progress-row">
              <span className="problems-progress-count">{solvedProblems}</span>
              <span className="problems-progress-total">of {problems.length} solved</span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default Problems;
