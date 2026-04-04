import React, { useState } from "react";

import "../style/GenerateTeams.css";
import api from "../api";

export const GenerateTeams = () => {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [numberOfTeams, setNumberOfTeams] = useState(1);
  const [teamInputs, setTeamInputs] = useState([{ name: "", institution: "" }]);

  const syncTeamInputs = (value) => {
    const inputs = Array.from({ length: value }, () => ({
      name: "",
      institution: "",
    }));
    setTeamInputs(inputs);
  };

  const handleNumberChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setNumberOfTeams(value);
    syncTeamInputs(value);
  };

  const adjustTeamCount = (delta) => {
    setNumberOfTeams((prev) => {
      const next = Math.max(1, prev + delta);
      syncTeamInputs(next);
      return next;
    });
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...teamInputs];
    updated[index][field] = value;
    setTeamInputs(updated);
  };

  const generateTeams = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (numberOfTeams < 1) {
      setError("Please enter a valid number of teams.");
      return;
    }

    try {
      const generatedTeams = [];
      for (let i = 0; i < teamInputs.length; i++) {
        const teamName = teamInputs[i].name || `Team${i + 1}`;
        const institution = teamInputs[i].institution || "Unknown";
        const password = Math.random().toString(36).slice(-8);

        const response = await api.post(
          "/auth/register",
          { name: teamName, password, institution },
        );

        if (response.data.token) {
          generatedTeams.push({ name: teamName, institution, password });
        } else {
          setError("Failed to register some teams. Please try again.");
          return;
        }
      }

      setTeams(generatedTeams);
      setSuccess(`${generatedTeams.length} teams generated successfully! ✅`);
    } catch (err) {
      console.error("Error generating teams:", err);
      setError(
        err.response?.data?.message ||
          "An error occurred while generating teams. Please try again."
      );
    }
  };

  // 🔹 Export to CSV
  const exportToCSV = () => {
    if (teams.length === 0) {
      setError("No teams available to export.");
      return;
    }

    const header = ["Team Name", "Institution", "Password"];
    const rows = teams.map((team) => [team.name, team.institution, team.password]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      header.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "teams.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="generate-teams-container">
      <div className="generate-teams-card">
        <h2>Generate Teams</h2>
        <form onSubmit={generateTeams} className="generate-teams-form">
          <div className="input-group">
            <label htmlFor="numberOfTeams">Number of Teams</label>
            <div className="team-count-control">
              <button type="button" className="team-count-button" onClick={() => adjustTeamCount(-1)}>
                -
              </button>
              <input
                type="number"
                id="numberOfTeams"
                value={numberOfTeams}
                onChange={handleNumberChange}
                min="1"
                required
              />
              <button type="button" className="team-count-button" onClick={() => adjustTeamCount(1)}>
                +
              </button>
            </div>
          </div>

          {teamInputs.map((team, index) => (
            <div key={index} className="team-inputs">
              <input
                type="text"
                placeholder={`Team ${index + 1} Name`}
                value={team.name}
                onChange={(e) =>
                  handleInputChange(index, "name", e.target.value)
                }
                required
              />
              <input
                type="text"
                placeholder={`Team ${index + 1} Institution`}
                value={team.institution}
                onChange={(e) =>
                  handleInputChange(index, "institution", e.target.value)
                }
                required
              />
            </div>
          ))}

          <button type="submit" className="generate-button">
            Generate Teams
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {teams.length > 0 && (
          <div className="teams-list">
            <h3>Generated Teams</h3>
            <table>
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Institution</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={index}>
                    <td>{team.name}</td>
                    <td>{team.institution}</td>
                    <td className="password">{team.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Export CSV button */}
            <button onClick={exportToCSV} className="export-button">
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
